const TOPIC_PREFIX = 'iot/v1';

const MESSAGE_QOS = {
  telemetry: 1,
  status: 1,
  command: 1,
  ack: 1,
  alert: 1,
  dlq: 1
};

function isoNow() {
  return new Date().toISOString();
}

function toNumber(value, fallback = null) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 2) {
  const multiplier = 10 ** digits;
  return Math.round(Number(value) * multiplier) / multiplier;
}

function requireString(value) {
  const text = String(value || '').trim();
  return text.length ? text : null;
}

function buildTelemetryTopic({ gatewayId, nodeId }) {
  return `${TOPIC_PREFIX}/gw/${gatewayId}/node/${nodeId}/telemetry`;
}

function buildStatusTopic({ gatewayId, nodeId }) {
  return `${TOPIC_PREFIX}/gw/${gatewayId}/node/${nodeId}/status`;
}

function buildCommandTopic({ gatewayId, nodeId }) {
  return `${TOPIC_PREFIX}/gw/${gatewayId}/node/${nodeId}/command`;
}

function buildAckTopic({ gatewayId, nodeId }) {
  return `${TOPIC_PREFIX}/gw/${gatewayId}/node/${nodeId}/ack`;
}

function buildAlertTopic({ severity = 'info', gatewayId = 'unknown', nodeId = 'unknown' }) {
  return `${TOPIC_PREFIX}/alerts/${severity}/${gatewayId}/${nodeId}`;
}

function buildDlqTopic({ gatewayId, nodeId }) {
  return `${TOPIC_PREFIX}/dlq/${gatewayId}/${nodeId}`;
}

function normalizeTelemetryPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const deviceId = requireString(payload.deviceId);
  const nodeId = requireString(payload.nodeId);
  const gatewayId = requireString(payload.gatewayId);
  const ts = requireString(payload.ts) || isoNow();
  const seq = toNumber(payload.seq, null);
  const rssi = toNumber(payload.rssi, null);
  const battery = toNumber(payload.battery, null);
  const sensors = payload.sensors && typeof payload.sensors === 'object' ? payload.sensors : null;
  const actuators = payload.actuators && typeof payload.actuators === 'object' ? payload.actuators : null;

  if (!deviceId || !nodeId || !gatewayId || seq === null || !sensors) {
    return null;
  }

  return {
    deviceId,
    nodeId,
    gatewayId,
    ts,
    seq,
    rssi,
    battery,
    sensors,
    ...(actuators ? { actuators } : {})
  };
}

function normalizeStatusPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const base = normalizeTelemetryPayload(payload);
  if (!base) {
    return null;
  }

  const status = payload.status && typeof payload.status === 'object' ? payload.status : null;
  if (!status) {
    return null;
  }

  return {
    ...base,
    status
  };
}

function getBmp280Sensor(sensors = {}) {
  return sensors.bmp280 || sensors.bme280 || {};
}

function getMq7Sensor(sensors = {}) {
  return sensors.mq7 || sensors.gas || {};
}

function getTemperatureReading(record) {
  return getBmp280Sensor(record?.sensors)?.temperature_c ?? record?.sensors?.temperature_c ?? null;
}

function getHumidityReading(record) {
  return getBmp280Sensor(record?.sensors)?.humidity_pct ?? record?.sensors?.humidity_pct ?? null;
}

function getPressureReading(record) {
  return getBmp280Sensor(record?.sensors)?.pressure_hpa ?? record?.sensors?.pressure_hpa ?? null;
}

function getLightReading(record) {
  return record?.sensors?.ldr?.light_pct ?? record?.sensors?.light_pct ?? null;
}

function getGasReading(record) {
  const mq7 = getMq7Sensor(record?.sensors);
  return mq7.co_ppm ?? mq7.gas_ppm ?? record?.sensors?.co_ppm ?? record?.sensors?.gas_ppm ?? null;
}

function normalizeCommandPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const deviceId = requireString(payload.deviceId);
  const nodeId = requireString(payload.nodeId);
  const gatewayId = requireString(payload.gatewayId);
  const ts = requireString(payload.ts) || isoNow();
  const seq = toNumber(payload.seq, null);
  const commandId = requireString(payload.commandId);
  const command = payload.command && typeof payload.command === 'object' ? payload.command : null;

  if (!deviceId || !nodeId || !gatewayId || seq === null || !commandId || !command || !requireString(command.type)) {
    return null;
  }

  return {
    deviceId,
    nodeId,
    gatewayId,
    ts,
    seq,
    commandId,
    command,
    requestedBy: payload.requestedBy && typeof payload.requestedBy === 'object' ? payload.requestedBy : null
  };
}

function normalizeAckPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const deviceId = requireString(payload.deviceId);
  const nodeId = requireString(payload.nodeId);
  const gatewayId = requireString(payload.gatewayId);
  const ts = requireString(payload.ts) || isoNow();
  const seq = toNumber(payload.seq, null);
  const commandId = requireString(payload.commandId);
  const ack = payload.ack && typeof payload.ack === 'object' ? payload.ack : null;

  if (!deviceId || !nodeId || !gatewayId || seq === null || !commandId || !ack) {
    return null;
  }

  return {
    deviceId,
    nodeId,
    gatewayId,
    ts,
    seq,
    commandId,
    ack
  };
}

function buildAlertFromTelemetry(record) {
  if (!record || typeof record !== 'object') {
    return null;
  }

  const temperature = getTemperatureReading(record);
  const humidity = getHumidityReading(record);
  const gas = getGasReading(record);
  const battery = record.battery;

  if (toNumber(temperature, null) !== null && Number(temperature) >= 29.5) {
    return {
      ts: isoNow(),
      nodeId: record.nodeId,
      gatewayId: record.gatewayId,
      severity: 'warning',
      rule: 'temperature_high',
      message: `Temperatura acima do limite em ${record.nodeId}: ${Number(temperature).toFixed(1)} C`,
      resolved: false,
      source: 'rules-engine'
    };
  }

  if (toNumber(humidity, null) !== null && Number(humidity) <= 15) {
    return {
      ts: isoNow(),
      nodeId: record.nodeId,
      gatewayId: record.gatewayId,
      severity: 'warning',
      rule: 'humidity_low',
      message: `Umidade abaixo do limite em ${record.nodeId}: ${Number(humidity).toFixed(1)} %`,
      resolved: false,
      source: 'rules-engine'
    };
  }

  if (toNumber(gas, null) !== null && Number(gas) >= 60) {
    return {
      ts: isoNow(),
      nodeId: record.nodeId,
      gatewayId: record.gatewayId,
      severity: 'warning',
      rule: 'gas_high',
      message: `Concentracao de CO elevada em ${record.nodeId}: ${Number(gas).toFixed(1)} ppm`,
      resolved: false,
      source: 'rules-engine'
    };
  }

  if (toNumber(battery, null) !== null && Number(battery) <= 3.55) {
    return {
      ts: isoNow(),
      nodeId: record.nodeId,
      gatewayId: record.gatewayId,
      severity: 'info',
      rule: 'battery_low',
      message: `Bateria baixa em ${record.nodeId}: ${Number(battery).toFixed(2)} V`,
      resolved: false,
      source: 'rules-engine'
    };
  }

  return null;
}

function dedupeKey(record) {
  return [record.gatewayId, record.nodeId, record.seq, record.ts].filter(Boolean).join(':');
}

function isHeartbeatStale(lastSeen, timeoutMs) {
  const lastSeenMs = new Date(lastSeen).getTime();
  return Number.isFinite(lastSeenMs) && Date.now() - lastSeenMs > timeoutMs;
}

function normalizeRssi(rssi) {
  const value = toNumber(rssi, -80);
  return clamp(value, -120, -20);
}

module.exports = {
  MESSAGE_QOS,
  TOPIC_PREFIX,
  buildTelemetryTopic,
  buildStatusTopic,
  buildCommandTopic,
  buildAckTopic,
  buildAlertTopic,
  buildDlqTopic,
  normalizeTelemetryPayload,
  normalizeStatusPayload,
  normalizeCommandPayload,
  normalizeAckPayload,
  buildAlertFromTelemetry,
  getBmp280Sensor,
  getMq7Sensor,
  getTemperatureReading,
  getHumidityReading,
  getPressureReading,
  getLightReading,
  getGasReading,
  dedupeKey,
  isHeartbeatStale,
  normalizeRssi,
  toNumber,
  round,
  isoNow
};