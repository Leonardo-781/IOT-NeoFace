const http = require('http');
const crypto = require('crypto');
const { createSimpleClient } = require('./lib/simple-broker-client');

const {
  buildAlertFromTelemetry,
  buildDlqTopic,
  buildStatusTopic,
  buildTelemetryTopic,
  dedupeKey,
  isoNow,
  normalizeAckPayload,
  normalizeCommandPayload,
  normalizeStatusPayload,
  normalizeTelemetryPayload,
  round
} = require('./lib/iot-contract');
const { createPostgresStore } = require('./lib/postgres-store');

const BROKER_URL = process.env.BROKER_URL || 'tcp://127.0.0.1:1883';
const BROKER_USER = process.env.BROKER_USER || '';
const BROKER_PASSWORD = process.env.BROKER_PASSWORD || '';
const HTTP_PORT = Number(process.env.INGEST_HTTP_PORT || 3102);
const DEDUPE_WINDOW_MS = Number(process.env.DEDUPE_WINDOW_MS || 10 * 60 * 1000);
const MAX_RETRIES = Number(process.env.INGEST_MAX_RETRIES || 3);
const DB = createPostgresStore({
  enabled: Boolean(process.env.DATABASE_URL || process.env.DB_HOST),
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: String(process.env.DB_SSL || '').toLowerCase() === 'true'
});

const metrics = {
  received: 0,
  telemetry: 0,
  status: 0,
  commands: 0,
  acks: 0,
  alerts: 0,
  dlq: 0,
  retries: 0,
  deduped: 0,
  mqttConnected: false,
  lastMessageAt: null,
  lastError: null
};

const seen = new Map();

function pruneSeen() {
  const threshold = Date.now() - DEDUPE_WINDOW_MS;
  for (const [key, value] of seen.entries()) {
    if (value < threshold) {
      seen.delete(key);
    }
  }
}

function sanitizeError(error) {
  return String(error?.message || error || 'unknown error');
}

let simpleClient = null;

function publishJson(topic, payload, options = {}) {
  if (!simpleClient) return Promise.reject(new Error('no-client'));
  simpleClient.publish(topic, payload);
  return Promise.resolve();
}

async function storeDlq(topic, payload, reason, attempts = 1) {
  const entry = {
    id: `dlq-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    ts: isoNow(),
    topic,
    reason,
    payload,
    attempts,
    gatewayId: payload?.gatewayId || null,
    nodeId: payload?.nodeId || null
  };

  metrics.dlq += 1;
  if (DB) {
    try {
      await DB.insertDlq(entry);
    } catch (error) {
      metrics.lastError = sanitizeError(error);
    }
  }

  try {
    await publishJson(buildDlqTopic({ gatewayId: entry.gatewayId || 'unknown', nodeId: entry.nodeId || 'unknown' }), entry, {
      qos: 1,
      retain: false
    });
  } catch (error) {
    metrics.lastError = sanitizeError(error);
  }
}

async function storeAlert(alert, sourcePayload) {
  const alertId = alert.id || `alt-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const finalAlert = {
    id: alertId,
    ...alert,
    ts: alert.ts || isoNow(),
    source: alert.source || 'rules-engine'
  };

  metrics.alerts += 1;
  if (DB) {
    await DB.insertAlert(finalAlert);
  }

  await publishJson(
    `iot/v1/alerts/${finalAlert.severity || 'info'}/${finalAlert.gatewayId || 'unknown'}/${finalAlert.nodeId || 'unknown'}`,
    finalAlert,
    { qos: 1, retain: false }
  );

  if (sourcePayload) {
    seen.set(dedupeKey(sourcePayload), Date.now());
  }
}

async function handleTelemetry(topic, payload) {
  const normalized = normalizeTelemetryPayload(payload);
  if (!normalized) {
    await storeDlq(topic, payload, 'invalid telemetry payload');
    return;
  }

  const key = dedupeKey(normalized);
  if (seen.has(key)) {
    metrics.deduped += 1;
    return;
  }

  metrics.telemetry += 1;
  metrics.lastMessageAt = isoNow();
  seen.set(key, Date.now());

  if (DB) {
    await DB.insertTelemetry(normalized, 'mqtt');
  }

  const alert = buildAlertFromTelemetry(normalized);
  if (alert) {
    alert.id = `alt-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    await storeAlert(alert, normalized);
  }
}

async function handleStatus(topic, payload) {
  const normalized = normalizeStatusPayload(payload);
  if (!normalized) {
    await storeDlq(topic, payload, 'invalid status payload');
    return;
  }

  const key = dedupeKey(normalized);
  if (seen.has(key)) {
    metrics.deduped += 1;
    return;
  }

  metrics.status += 1;
  metrics.lastMessageAt = isoNow();
  seen.set(key, Date.now());

  if (DB) {
    await DB.upsertNode({
      nodeId: normalized.nodeId,
      deviceId: normalized.deviceId,
      gatewayId: normalized.gatewayId,
      status: normalized.status?.online === false ? 'offline' : 'online',
      seq: normalized.seq,
      rssi: normalized.rssi,
      battery: normalized.battery,
      lastSeen: normalized.ts,
      samplingIntervalSec: normalized.status?.samplingIntervalSec || 300,
      meshParent: normalized.status?.meshParent || null,
      hopCount: normalized.status?.hopCount || 0
    });
  }

  await publishJson(buildStatusTopic({ gatewayId: normalized.gatewayId, nodeId: normalized.nodeId }), normalized, {
    qos: 1,
    retain: true
  });
}

async function handleCommand(topic, payload) {
  const normalized = normalizeCommandPayload(payload);
  if (!normalized) {
    await storeDlq(topic, payload, 'invalid command payload');
    return;
  }

  metrics.commands += 1;
  metrics.lastMessageAt = isoNow();

  if (DB) {
    await DB.insertCommand({
      ...normalized,
      status: 'queued'
    });
  }
}

async function handleAck(topic, payload) {
  const normalized = normalizeAckPayload(payload);
  if (!normalized) {
    await storeDlq(topic, payload, 'invalid ack payload');
    return;
  }

  metrics.acks += 1;
  metrics.lastMessageAt = isoNow();

  if (DB) {
    await DB.insertAck({
      id: `ack-${normalized.commandId}`,
      ...normalized,
      status: normalized.ack?.status || 'executed',
      detail: normalized.ack?.detail || normalized.ack?.message || ''
    });
  }
}

function onMessage(topic, message) {
  metrics.received += 1;
  const raw = message.toString('utf8');

  let payload;
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch (error) {
    metrics.retries += 1;
    return storeDlq(topic, { raw }, 'json parse error');
  }

  const runner = topic.endsWith('/telemetry')
    ? handleTelemetry(topic, payload)
    : topic.endsWith('/status')
      ? handleStatus(topic, payload)
      : topic.endsWith('/command')
        ? handleCommand(topic, payload)
        : topic.endsWith('/ack')
          ? handleAck(topic, payload)
          : null;

  if (runner) {
    runner.catch(async (error) => {
      metrics.retries += 1;
      metrics.lastError = sanitizeError(error);
      const attempts = Number(payload?.attempts || 1);
      if (attempts < MAX_RETRIES) {
        await storeDlq(topic, payload, sanitizeError(error), attempts + 1);
        return;
      }
      await storeDlq(topic, payload, sanitizeError(error), attempts);
    });
  }
}

function connectBroker() {
  simpleClient = createSimpleClient(BROKER_URL);
  simpleClient.on('connect', async () => {
    metrics.mqttConnected = true;
    simpleClient.subscribe('iot/v1/gw/+/node/+/telemetry');
    simpleClient.subscribe('iot/v1/gw/+/node/+/status');
    simpleClient.subscribe('iot/v1/gw/+/node/+/command');
    simpleClient.subscribe('iot/v1/gw/+/node/+/ack');

    if (DB) {
      try {
        await DB.ensureSchema();
      } catch (error) {
        metrics.lastError = sanitizeError(error);
      }
    }
  });

  simpleClient.on('close', () => {
    metrics.mqttConnected = false;
  });

  simpleClient.on('error', (error) => {
    metrics.lastError = sanitizeError(error);
  });

  simpleClient.on('message', (topic, payload) => {
    try {
      onMessage(topic, Buffer.from(JSON.stringify(payload)));
    } catch (err) {
      metrics.lastError = sanitizeError(err);
    }
  });
}

function healthResponse() {
  return {
    ok: true,
    service: 'ingest-worker',
    mqttConnected: metrics.mqttConnected,
    received: metrics.received,
    telemetry: metrics.telemetry,
    status: metrics.status,
    commands: metrics.commands,
    acks: metrics.acks,
    alerts: metrics.alerts,
    dlq: metrics.dlq,
    deduped: metrics.deduped,
    retries: metrics.retries,
    lastMessageAt: metrics.lastMessageAt,
    lastError: metrics.lastError,
    ts: isoNow()
  };
}

const httpServer = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/ready') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(healthResponse(), null, 2));
    return;
  }

  if (req.url === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ...metrics, ts: isoNow() }, null, 2));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Not found' }, null, 2));
});

connectBroker();

httpServer.listen(HTTP_PORT, () => {
  console.log(`Ingestion service listening on http://0.0.0.0:${HTTP_PORT}`);
});

setInterval(pruneSeen, DEDUPE_WINDOW_MS);

process.on('SIGINT', async () => {
  httpServer.close();
  if (simpleClient) simpleClient.end();
  if (DB) {
    await DB.close();
  }
  process.exit(0);
});