const fs = require('fs');
const path = require('path');
const { getBmp280Sensor, getMq7Sensor } = require('./iot-contract');

let PoolCtor = null;
try {
  ({ Pool: PoolCtor } = require('pg'));
} catch (error) {
  PoolCtor = null;
}

function buildPoolConfig(config = {}) {
  if (config.connectionString) {
    return {
      connectionString: config.connectionString,
      ssl: config.ssl ? { rejectUnauthorized: false } : false
    };
  }

  return {
    host: config.host || '127.0.0.1',
    port: Number(config.port || 5432),
    database: config.database || 'iot_monitoring',
    user: config.user || config.username || 'iot_user',
    password: config.password || '',
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
    max: Number(config.maxConnections || 10)
  };
}

function splitSqlStatements(sqlText) {
  return sqlText
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function createPostgresStore(config = {}) {
  if (!PoolCtor || (!config.enabled && !config.connectionString && !config.host)) {
    return null;
  }

  const pool = new PoolCtor(buildPoolConfig(config));
  const schemaPath = path.join(__dirname, '..', 'sql', 'timescaledb-schema.sql');

  function telemetryRowToPayload(row) {
    return {
      deviceId: row.device_id,
      nodeId: row.node_id,
      gatewayId: row.gateway_id,
      ts: row.ts,
      seq: Number(row.seq),
      rssi: row.rssi === null ? null : Number(row.rssi),
      battery: row.battery === null ? null : Number(row.battery),
      sensors: row.payload?.sensors || row.payload || {},
      actuators: row.payload?.actuators || row.payload?.outputs || {}
    };
  }

  async function query(text, params = []) {
    return pool.query(text, params);
  }

  async function ensureSchema() {
    if (!fs.existsSync(schemaPath)) {
      return;
    }

    const schemaText = fs.readFileSync(schemaPath, 'utf8');
    for (const statement of splitSqlStatements(schemaText)) {
      try {
        await query(statement);
      } catch (error) {
        const message = String(error.message || '').toLowerCase();
        if (
          message.includes('timescaledb') ||
          message.includes('create_hypertable') ||
          message.includes('already exists') ||
          message.includes('extension')
        ) {
          continue;
        }
        throw error;
      }
    }
  }

  async function upsertGateway(gateway) {
    if (!gateway?.gatewayId) {
      return;
    }

    await query(
      `INSERT INTO gateways (gateway_id, name, host, location, status, last_seen, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now())
       ON CONFLICT (gateway_id) DO UPDATE SET
         name = EXCLUDED.name,
         host = EXCLUDED.host,
         location = EXCLUDED.location,
         status = EXCLUDED.status,
         last_seen = EXCLUDED.last_seen,
         updated_at = now()`,
      [
        gateway.gatewayId,
        gateway.name || '',
        gateway.host || '',
        gateway.location || '',
        gateway.status || 'online',
        gateway.lastSeen || null
      ]
    );
  }

  async function upsertNode(node) {
    if (!node?.nodeId || !node?.deviceId) {
      return;
    }

    await upsertGateway({
      gatewayId: node.gatewayId || 'GW01',
      status: node.status || 'online',
      lastSeen: node.lastSeen
    });

    await query(
      `INSERT INTO nodes (
         node_id, device_id, gateway_id, name, location, status, seq, rssi, battery,
         last_seen, sampling_interval_sec, mesh_parent, hop_count, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, now())
       ON CONFLICT (node_id) DO UPDATE SET
         device_id = EXCLUDED.device_id,
         gateway_id = EXCLUDED.gateway_id,
         name = EXCLUDED.name,
         location = EXCLUDED.location,
         status = EXCLUDED.status,
         seq = EXCLUDED.seq,
         rssi = EXCLUDED.rssi,
         battery = EXCLUDED.battery,
         last_seen = EXCLUDED.last_seen,
         sampling_interval_sec = EXCLUDED.sampling_interval_sec,
         mesh_parent = EXCLUDED.mesh_parent,
         hop_count = EXCLUDED.hop_count,
         updated_at = now()`,
      [
        node.nodeId,
        node.deviceId,
        node.gatewayId || 'GW01',
        node.name || node.nodeId,
        node.location || 'indefinido',
        node.status || 'online',
        Number(node.seq || 0),
        node.rssi ?? -80,
        node.battery ?? 0,
        node.lastSeen || null,
        Number(node.samplingIntervalSec || 300),
        node.meshParent || null,
        Number(node.hopCount || 0)
      ]
    );
  }

  async function insertTelemetry(record, source = 'mqtt') {
    await upsertNode(record);

    const sensors = record.sensors || {};
    const bmp280 = getBmp280Sensor(sensors);
    const ldr = sensors.ldr || {};
    const mq7 = getMq7Sensor(sensors);

    await query(
      `INSERT INTO telemetry (
        ts, gateway_id, node_id, device_id, seq, rssi, battery, payload,
        temperature_c, humidity_pct, pressure_hpa, light_pct, gas_ppm, source
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14)`,
      [
        record.ts,
        record.gatewayId,
        record.nodeId,
        record.deviceId,
        Number(record.seq),
        record.rssi,
        record.battery,
        JSON.stringify(record),
        bmp280.temperature_c ?? null,
        bmp280.humidity_pct ?? null,
        bmp280.pressure_hpa ?? null,
        ldr.light_pct ?? null,
        mq7.co_ppm ?? mq7.gas_ppm ?? null,
        source
      ]
    );
  }

  async function insertAlert(alert) {
    if (!alert?.id) {
      return;
    }

    await query(
      `INSERT INTO alerts (id, ts, gateway_id, node_id, severity, rule, message, resolved, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO UPDATE SET
         ts = EXCLUDED.ts,
         severity = EXCLUDED.severity,
         rule = EXCLUDED.rule,
         message = EXCLUDED.message,
         resolved = EXCLUDED.resolved,
         source = EXCLUDED.source`,
      [
        alert.id,
        alert.ts,
        alert.gatewayId,
        alert.nodeId,
        alert.severity,
        alert.rule,
        alert.message,
        Boolean(alert.resolved),
        alert.source || 'rules-engine'
      ]
    );
  }

  async function insertCommand(command) {
    if (!command?.commandId) {
      return;
    }

    await query(
      `INSERT INTO commands (
        command_id, gateway_id, node_id, device_id, ts, seq, action, params, status, requested_by, ack
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10::jsonb,$11::jsonb)
      ON CONFLICT (command_id) DO UPDATE SET
        status = EXCLUDED.status,
        ack = EXCLUDED.ack,
        params = EXCLUDED.params,
        requested_by = EXCLUDED.requested_by`,
      [
        command.commandId,
        command.gatewayId,
        command.nodeId,
        command.deviceId,
        command.ts,
        Number(command.seq || 0),
        command.action,
        JSON.stringify(command.params || {}),
        command.status || 'queued',
        JSON.stringify(command.requestedBy || {}),
        command.ack ? JSON.stringify(command.ack) : null
      ]
    );
  }

  async function insertAck(ack) {
    if (!ack?.commandId) {
      return;
    }

    await query(
      `INSERT INTO command_acks (id, command_id, node_id, gateway_id, ts, status, detail, payload)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
       ON CONFLICT (id) DO UPDATE SET
         ts = EXCLUDED.ts,
         status = EXCLUDED.status,
         detail = EXCLUDED.detail,
         payload = EXCLUDED.payload`,
      [
        ack.id || ack.commandId,
        ack.commandId,
        ack.nodeId,
        ack.gatewayId,
        ack.ts,
        ack.status || 'executed',
        ack.detail || '',
        JSON.stringify(ack.payload || ack)
      ]
    );

    await query(
      `UPDATE commands
       SET status = $2, ack = $3::jsonb
       WHERE command_id = $1`,
      [ack.commandId, ack.status || 'executed', JSON.stringify(ack)]
    );
  }

  async function insertDlq(entry) {
    if (!entry?.id) {
      return;
    }

    await query(
      `INSERT INTO dlq_events (id, ts, gateway_id, node_id, topic, reason, payload, attempts)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)
       ON CONFLICT (id) DO UPDATE SET
         attempts = EXCLUDED.attempts,
         reason = EXCLUDED.reason,
         payload = EXCLUDED.payload`,
      [
        entry.id,
        entry.ts,
        entry.gatewayId || null,
        entry.nodeId || null,
        entry.topic,
        entry.reason,
        JSON.stringify(entry.payload || {}),
        Number(entry.attempts || 1)
      ]
    );
  }

  async function loadNodes() {
    const result = await query(
      `SELECT n.*, COALESCE(t.latest_payload, '{}'::jsonb) AS latest_payload,
              t.latest_ts, t.latest_rssi, t.latest_battery
       FROM nodes n
       LEFT JOIN LATERAL (
         SELECT payload AS latest_payload, ts AS latest_ts, rssi AS latest_rssi, battery AS latest_battery
         FROM telemetry t
         WHERE t.node_id = n.node_id
         ORDER BY ts DESC
         LIMIT 1
       ) t ON TRUE
       ORDER BY n.node_id ASC`
    );

    return result.rows.map((row) => ({
      nodeId: row.node_id,
      deviceId: row.device_id,
      gatewayId: row.gateway_id,
      name: row.name,
      location: row.location,
      status: row.status,
      seq: Number(row.seq || 0),
      rssi: Number(row.rssi || -80),
      battery: Number(row.battery || 0),
      lastSeen: row.last_seen,
      samplingIntervalSec: Number(row.sampling_interval_sec || 300),
      meshParent: row.mesh_parent,
      hopCount: Number(row.hop_count || 0),
      latest: row.latest_ts
        ? {
            deviceId: row.device_id,
            nodeId: row.node_id,
            gatewayId: row.gateway_id,
            ts: row.latest_ts,
            seq: Number(row.seq || 0),
            rssi: row.latest_rssi,
            battery: row.latest_battery,
            sensors: row.latest_payload?.sensors || row.latest_payload
          }
        : null
    }));
  }

  async function loadTelemetry({ nodeId = null, limit = 30 } = {}) {
    const params = [];
    let whereClause = '';

    if (nodeId) {
      params.push(nodeId);
      whereClause = 'WHERE node_id = $1';
    }

    params.push(Number(limit || 30));

    const result = await query(
      `SELECT * FROM telemetry ${whereClause} ORDER BY ts DESC LIMIT $${params.length}`,
      params
    );

    return result.rows.map(telemetryRowToPayload).reverse();
  }

  async function loadAlerts(openOnly = false) {
    const result = await query(
      `SELECT * FROM alerts ${openOnly ? 'WHERE resolved = FALSE' : ''} ORDER BY ts DESC LIMIT 100`
    );
    return result.rows.map((row) => ({
      id: row.id,
      ts: row.ts,
      gatewayId: row.gateway_id,
      nodeId: row.node_id,
      severity: row.severity,
      rule: row.rule,
      message: row.message,
      resolved: row.resolved,
      source: row.source
    }));
  }

  async function loadCommands() {
    const result = await query(
      `SELECT * FROM commands ORDER BY ts DESC LIMIT 100`
    );
    return result.rows.map((row) => ({
      commandId: row.command_id,
      deviceId: row.device_id,
      nodeId: row.node_id,
      gatewayId: row.gateway_id,
      ts: row.ts,
      seq: Number(row.seq || 0),
      action: row.action,
      params: row.params || {},
      status: row.status,
      requestedBy: row.requested_by || null,
      ack: row.ack || null
    }));
  }

  async function summary() {
    const [nodesResult, telemetryResult, alertsResult, latestResult, avgResult] = await Promise.all([
      query('SELECT COUNT(*)::int AS count, COUNT(*) FILTER (WHERE status = \'online\')::int AS online FROM nodes'),
      query('SELECT COUNT(*)::int AS count FROM telemetry'),
      query('SELECT COUNT(*)::int AS count FROM alerts WHERE resolved = FALSE'),
      query('SELECT MAX(ts) AS latest_ts FROM telemetry'),
      query("SELECT ROUND(AVG(temperature_c)::numeric, 1) AS avg_temperature FROM telemetry WHERE temperature_c IS NOT NULL")
    ]);

    return {
      machine: 'distributed-api',
      nodesTotal: nodesResult.rows[0]?.count || 0,
      nodesOnline: nodesResult.rows[0]?.online || 0,
      alertsOpen: alertsResult.rows[0]?.count || 0,
      telemetryCount: telemetryResult.rows[0]?.count || 0,
      avgTemperature: avgResult.rows[0]?.avg_temperature ?? null,
      latestTimestamp: latestResult.rows[0]?.latest_ts || null,
      metrics: {}
    };
  }

  async function close() {
    await pool.end();
  }

  return {
    pool,
    ensureSchema,
    upsertGateway,
    upsertNode,
    insertTelemetry,
    insertAlert,
    insertCommand,
    insertAck,
    insertDlq,
    loadNodes,
    loadTelemetry,
    loadAlerts,
    loadCommands,
    summary,
    close
  };
}

module.exports = {
  createPostgresStore
};