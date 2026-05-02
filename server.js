const http = require('http');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');
const { createSimpleClient } = require('./lib/simple-broker-client');
const { buildTelemetryTopic, buildCommandTopic } = require('./lib/iot-contract');
const {
  getBmp280Sensor,
  getLightReading,
  getGasReading,
  getTemperatureReading
} = require('./lib/iot-contract');

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SYSTEM_CONFIG_FILE = path.join(DATA_DIR, 'system_config.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const SIMULATION_INTERVAL_MS = Number(process.env.SIMULATION_INTERVAL_MS || 5000);
const COMMAND_ACK_DELAY_MS = Number(process.env.COMMAND_ACK_DELAY_MS || 1200);
const MAX_TELEMETRY_POINTS = Number(process.env.MAX_TELEMETRY_POINTS || 120);
const AUTH_COOKIE_NAME = 'tf_session';
const DEFAULT_ADMIN_USER = process.env.LOGIN_USER || 'admin';
const DEFAULT_ADMIN_PASSWORD = process.env.LOGIN_PASSWORD || '123456';
const USER_ROLES = ['admin', 'operator', 'viewer'];

const clients = new Set();
const sessions = new Map();

const BROKER_URL = process.env.BROKER_URL || 'tcp://127.0.0.1:1883';
let apiBrokerClient = null;
if (BROKER_URL) {
  apiBrokerClient = createSimpleClient(BROKER_URL);
  apiBrokerClient.on('connect', () => console.log('API connected to broker', BROKER_URL));
  apiBrokerClient.on('error', (err) => console.error('API broker error', err && err.message));
}

const { createPostgresStore } = require('./lib/postgres-store');
let DB = null;

const defaultState = () => ({
  generatedAt: new Date().toISOString(),
  nodes: [
    {
      nodeId: 'NODE07',
      deviceId: 'ESP32-001',
      gatewayId: 'GW01',
      name: 'Laboratorio 1',
      location: 'Bloco A',
      status: 'online',
      seq: 1800,
      rssi: -60,
      battery: 3.94,
      lastSeen: new Date().toISOString(),
      samplingIntervalSec: 300
    },
    {
      nodeId: 'NODE08',
      deviceId: 'ESP32-002',
      gatewayId: 'GW01',
      name: 'Corredor',
      location: 'Bloco B',
      status: 'online',
      seq: 1421,
      rssi: -67,
      battery: 3.88,
      lastSeen: new Date().toISOString(),
      samplingIntervalSec: 300
    },
    {
      nodeId: 'NODE09',
      deviceId: 'ESP32-003',
      gatewayId: 'GW01',
      name: 'Sala de Servidores',
      location: 'Bloco C',
      status: 'online',
      seq: 2045,
      rssi: -55,
      battery: 3.77,
      lastSeen: new Date().toISOString(),
      samplingIntervalSec: 300
    },
    {
      nodeId: 'NODE10',
      deviceId: 'ESP32-004',
      gatewayId: 'GW01',
      name: 'Area Externa',
      location: 'Pátio',
      status: 'online',
      seq: 990,
      rssi: -72,
      battery: 3.83,
      lastSeen: new Date().toISOString(),
      samplingIntervalSec: 300
    }
  ],
  telemetry: [],
  alerts: [],
  commands: [],
  metrics: {
    ingested: 0,
    alertsRaised: 0,
    commandsSent: 0,
    commandAcks: 0
  }
});

let state = defaultState();
let users = [];
let systemConfig = null;
let saveTimer = null;
let usersSaveTimer = null;
let configSaveTimer = null;

function defaultSystemConfig() {
  return {
    database: {
      enabled: false,
      engine: 'timescaledb',
      host: '127.0.0.1',
      port: 5432,
      database: 'iot_monitoring',
      username: 'iot_user',
      password: '',
      ssl: false,
      retentionDays: 30
    }
  };
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return {
    salt,
    hash: crypto.pbkdf2Sync(String(password), salt, 120000, 32, 'sha256').toString('hex')
  };
}

function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

function normalizeRole(role) {
  const value = String(role || '').toLowerCase();
  return USER_ROLES.includes(value) ? value : 'viewer';
}

function getSafeUser(user) {
  if (!user) {
    return null;
  }
  const role = normalizeRole(user.role || (String(user.username || '').toLowerCase() === DEFAULT_ADMIN_USER.toLowerCase() ? 'admin' : 'viewer'));
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role,
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function scheduleUsersSave() {
  if (usersSaveTimer) {
    clearTimeout(usersSaveTimer);
  }
  usersSaveTimer = setTimeout(async () => {
    usersSaveTimer = null;
    try {
      await fsp.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save users:', error.message);
    }
  }, 250);
}

function seedDefaultUsersIfNeeded() {
  if (users.length > 0) {
    return;
  }

  const passwordParts = hashPassword(DEFAULT_ADMIN_PASSWORD);
  const now = isoNow();
  users = [
    {
      id: 'user-admin',
      username: DEFAULT_ADMIN_USER,
      displayName: 'Administrador',
      role: 'admin',
      active: true,
      salt: passwordParts.salt,
      passwordHash: passwordParts.hash,
      createdAt: now,
      updatedAt: now
    }
  ];
  scheduleUsersSave();
}

function readUsersFromDisk() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      seedDefaultUsersIfNeeded();
      return;
    }

    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    users = Array.isArray(parsed) ? parsed : [];
    if (!users.length) {
      seedDefaultUsersIfNeeded();
    }
  } catch (error) {
    console.error('Failed to load users, using defaults:', error.message);
    seedDefaultUsersIfNeeded();
  }
}

function readSystemConfigFromDisk() {
  try {
    if (!fs.existsSync(SYSTEM_CONFIG_FILE)) {
      systemConfig = defaultSystemConfig();
      scheduleConfigSave();
      return;
    }

    const raw = fs.readFileSync(SYSTEM_CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    systemConfig = {
      ...defaultSystemConfig(),
      ...(parsed || {}),
      database: {
        ...defaultSystemConfig().database,
        ...((parsed && parsed.database) || {})
      }
    };
  } catch (error) {
    console.error('Failed to load system config, using defaults:', error.message);
    systemConfig = defaultSystemConfig();
    scheduleConfigSave();
  }
}

function scheduleConfigSave() {
  if (configSaveTimer) {
    clearTimeout(configSaveTimer);
  }
  configSaveTimer = setTimeout(async () => {
    configSaveTimer = null;
    try {
      await fsp.writeFile(SYSTEM_CONFIG_FILE, JSON.stringify(systemConfig, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save system config:', error.message);
    }
  }, 250);
}

function sanitizeDbConfigForResponse(config, includeSecrets = false) {
  const safe = {
    ...config,
    password: includeSecrets ? config.password : config.password ? '***' : ''
  };
  return safe;
}

function createUser({ username, password, displayName, role }) {
  const passwordParts = hashPassword(password);
  const now = isoNow();
  return {
    id: `user-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    username,
    displayName: displayName || username,
    role: normalizeRole(role),
    active: true,
    salt: passwordParts.salt,
    passwordHash: passwordParts.hash,
    createdAt: now,
    updatedAt: now
  };
}

function updateUser(user, changes) {
  if (changes.displayName !== undefined) {
    user.displayName = String(changes.displayName || user.displayName).trim() || user.displayName;
  }
  if (changes.role !== undefined) {
    user.role = normalizeRole(changes.role);
  }
  if (changes.active !== undefined) {
    user.active = Boolean(changes.active);
  }
  if (changes.password) {
    const passwordParts = hashPassword(changes.password);
    user.salt = passwordParts.salt;
    user.passwordHash = passwordParts.hash;
  }
  user.updatedAt = isoNow();
}

function findUserByUsername(username) {
  return users.find((user) => user.username.toLowerCase() === String(username || '').trim().toLowerCase()) || null;
}

function findUserById(id) {
  return users.find((user) => user.id === id) || null;
}

function readStateFromDisk() {
  try {
    if (!fs.existsSync(STATE_FILE)) {
      return;
    }
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    state = {
      ...defaultState(),
      ...parsed,
      nodes: Array.isArray(parsed.nodes) ? parsed.nodes : defaultState().nodes,
      telemetry: Array.isArray(parsed.telemetry) ? parsed.telemetry : [],
      alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
      commands: Array.isArray(parsed.commands) ? parsed.commands : [],
      metrics: {
        ...defaultState().metrics,
        ...(parsed.metrics || {})
      }
    };
  } catch (error) {
    console.error('Failed to load state, using defaults:', error.message);
    state = defaultState();
  }
}

function scheduleSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    try {
      await fsp.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save state:', error.message);
    }
  }, 250);
}

function isoNow() {
  return new Date().toISOString();
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload, null, 2));
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon'
  }[ext] || 'application/octet-stream';

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Arquivo nao encontrado');
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
}

function sendNotFound(res) {
  sendJson(res, 404, { error: 'Not found' });
}

function sendBadRequest(res, message) {
  sendJson(res, 400, { error: message });
}

function sendUnauthorized(res, message = 'Nao autenticado') {
  sendJson(res, 401, { error: message });
}

function sendForbidden(res, message = 'Sem permissao') {
  sendJson(res, 403, { error: message });
}

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((acc, part) => {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (!rawKey) {
      return acc;
    }
    acc[rawKey] = decodeURIComponent(rawValue.join('=') || '');
    return acc;
  }, {});
}

function createSession(user) {
  const token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  sessions.set(token, user);
  return token;
}

function clearSession(token) {
  if (token) {
    sessions.delete(token);
  }
}

function getSession(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[AUTH_COOKIE_NAME];
  if (!token || !sessions.has(token)) {
    return { token: null, user: null };
  }
  return { token, user: sessions.get(token) };
}

function refreshSessionUser(sessionUser) {
  const freshUser = findUserById(sessionUser.id);
  if (!freshUser || !freshUser.active) {
    return getSafeUser(sessionUser);
  }
  return getSafeUser(freshUser);
}

function setAuthCookie(res, token) {
  res.setHeader('Set-Cookie', `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax`);
}

function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`);
}

function requireSession(req, res) {
  const session = getSession(req);
  const user = session.user ? refreshSessionUser(session.user) : null;
  if (!user) {
    if (session.token) {
      clearSession(session.token);
    }
    sendUnauthorized(res);
    return null;
  }

  sessions.set(session.token, user);
  req.user = user;
  req.sessionToken = session.token;
  return user;
}

function requireRole(req, res, allowedRoles) {
  const user = requireSession(req, res);
  if (!user) {
    return null;
  }
  if (!allowedRoles.includes(user.role)) {
    sendForbidden(res);
    return null;
  }
  return user;
}

function isPublicRoute(pathname, method) {
  if (pathname === '/api/health' || pathname === '/api/login' || pathname === '/api/me' || pathname === '/api/ingest') {
    return true;
  }
  if (pathname === '/logout' || pathname === '/login') {
    return true;
  }
  if (pathname.startsWith('/public/')) {
    return pathname.endsWith('styles.css') || pathname.endsWith('login.html');
  }
  if (pathname === '/' && method === 'GET') {
    return true;
  }
  return false;
}

function requireAuth(req, res, pathname) {
  if (isPublicRoute(pathname, req.method)) {
    return true;
  }

  const user = requireSession(req, res);
  if (!user) {
    return false;
  }
  return true;
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => {
      chunks.push(chunk);
      if (Buffer.concat(chunks).length > 1_000_000) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!chunks.length) {
        resolve('');
        return;
      }
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', reject);
  });
}

function parseJsonBody(text) {
  if (!text) {
    return {};
  }
  return JSON.parse(text);
}

function latestTelemetryForNode(nodeId) {
  const points = state.telemetry.filter((item) => item.nodeId === nodeId);
  return points.length ? points[points.length - 1] : null;
}

function getRecentTelemetry(nodeId, limit = 30) {
  const points = state.telemetry.filter((item) => item.nodeId === nodeId);
  return points.slice(-limit);
}

function getLatestByNode() {
  return state.nodes.map((node) => {
    const latest = latestTelemetryForNode(node.nodeId);
    return {
      ...node,
      latest
    };
  });
}

function countOnlineNodes() {
  return state.nodes.filter((node) => node.status === 'online').length;
}

function toNumber(value, digits = 2) {
  return Number(Number(value).toFixed(digits));
}

function createTelemetryRecord(node) {
  const temperatureBase = {
    NODE07: 24.8,
    NODE08: 23.6,
    NODE09: 26.2,
    NODE10: 28.1
  }[node.nodeId] || 25;

  const humidityBase = {
    NODE07: 60,
    NODE08: 57,
    NODE09: 49,
    NODE10: 65
  }[node.nodeId] || 55;

  const lightBase = {
    NODE07: 1800,
    NODE08: 2200,
    NODE09: 950,
    NODE10: 3200
  }[node.nodeId] || 1500;

  const temperature = toNumber(temperatureBase + (Math.random() - 0.5) * 1.8, 1);
  const humidity = toNumber(Math.min(95, Math.max(15, humidityBase + (Math.random() - 0.5) * 6)), 1);
  const pressure = toNumber(1013 + (Math.random() - 0.5) * 2.4, 1);
  const lightRaw = Math.max(0, Math.round(lightBase + (Math.random() - 0.5) * 500));
  const lightPct = Math.max(0, Math.min(100, Math.round((lightRaw / 4095) * 100)));
  const gasRaw = Math.max(0, Math.round(120 + (Math.random() - 0.5) * 35));
  const gasPpm = toNumber(Math.max(10, gasRaw + (Math.random() - 0.5) * 8), 1);
  const ds18b20 = toNumber(temperature + (Math.random() - 0.5) * 0.6, 1);
  const profile = {
    NODE07: { ldr: false, mq7: false },
    NODE08: { ldr: true, mq7: false },
    NODE09: { ldr: true, mq7: true },
    NODE10: { ldr: false, mq7: true }
  }[node.nodeId] || { ldr: true, mq7: false };

  const rgbMode = ['off', 'green', 'blue', 'red'][node.seq % 4];

  node.seq += 1;
  node.rssi = Math.max(-95, Math.min(-35, node.rssi + Math.round((Math.random() - 0.5) * 4)));
  node.battery = toNumber(Math.max(3.5, node.battery - (Math.random() < 0.2 ? 0.005 : 0.001)), 2);
  node.lastSeen = isoNow();
  node.status = 'online';

  return {
    deviceId: node.deviceId,
    nodeId: node.nodeId,
    gatewayId: node.gatewayId,
    ts: isoNow(),
    seq: node.seq,
    rssi: node.rssi,
    battery: node.battery,
    sensors: {
      bmp280: {
        temperature_c: temperature,
        pressure_hpa: pressure
      },
      ...(profile.ldr
        ? {
            ldr: {
              light_raw: lightRaw,
              light_pct: lightPct
            }
          }
        : {}),
      ...(profile.mq7
        ? {
            mq7: {
              gas_raw: gasRaw,
              co_ppm: gasPpm
            }
          }
        : {}),
      ds18b20: {
        temperature_c: ds18b20
      }
    },
    actuators: {
      rgb_led: {
        state: rgbMode === 'off' ? 'off' : 'on',
        color: rgbMode
      }
    }
  };
}

function normalizeTelemetryPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const required = ['deviceId', 'nodeId', 'gatewayId', 'ts', 'seq', 'sensors'];
  for (const key of required) {
    if (payload[key] === undefined || payload[key] === null) {
      return null;
    }
  }

  return {
    deviceId: String(payload.deviceId),
    nodeId: String(payload.nodeId),
    gatewayId: String(payload.gatewayId),
    ts: String(payload.ts),
    seq: Number(payload.seq),
    rssi: Number.isFinite(Number(payload.rssi)) ? Number(payload.rssi) : -60,
    battery: Number.isFinite(Number(payload.battery)) ? toNumber(payload.battery, 2) : 0,
    sensors: payload.sensors,
    ...(payload.actuators && typeof payload.actuators === 'object' ? { actuators: payload.actuators } : {})
  };
}

function upsertNodeFromTelemetry(record) {
  let node = state.nodes.find((item) => item.nodeId === record.nodeId);

  if (!node) {
    node = {
      nodeId: record.nodeId,
      deviceId: record.deviceId,
      gatewayId: record.gatewayId,
      name: record.nodeId,
      location: 'indefinido',
      status: 'online',
      seq: record.seq,
      rssi: record.rssi,
      battery: record.battery,
      lastSeen: record.ts,
      samplingIntervalSec: 300
    };
    state.nodes.push(node);
    return node;
  }

  node.deviceId = record.deviceId || node.deviceId;
  node.gatewayId = record.gatewayId || node.gatewayId;
  node.status = 'online';
  node.seq = Number.isFinite(record.seq) ? record.seq : node.seq;
  node.rssi = Number.isFinite(record.rssi) ? record.rssi : node.rssi;
  node.battery = Number.isFinite(record.battery) ? record.battery : node.battery;
  node.lastSeen = record.ts || isoNow();
  return node;
}

function registerTelemetry(record, source = 'simulation') {
  const normalized = normalizeTelemetryPayload(record);
  if (!normalized) {
    return false;
  }

  upsertNodeFromTelemetry(normalized);
  pushTelemetry(normalized);
  maybeRaiseAlert(normalized);
  broadcast({ type: 'telemetry', source, payload: normalized });
  broadcast({ type: 'summary', payload: getSummary() });
  return true;
}

function pushTelemetry(record) {
  state.telemetry.push(record);
  if (state.telemetry.length > MAX_TELEMETRY_POINTS) {
    state.telemetry = state.telemetry.slice(-MAX_TELEMETRY_POINTS);
  }
  state.metrics.ingested += 1;
  scheduleSave();
}

function maybeRaiseAlert(record) {
  const temp = getTemperatureReading(record);
  const light = getLightReading(record);
  const gas = getGasReading(record);
  let alert = null;

  if (Number.isFinite(Number(temp)) && Number(temp) >= 29.5) {
    alert = {
      id: `ALT-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      ts: isoNow(),
      nodeId: record.nodeId,
      gatewayId: record.gatewayId,
      severity: 'warning',
      rule: 'temperature_high',
      message: `Temperatura acima do limite em ${record.nodeId}: ${temp.toFixed(1)} C`,
      resolved: false
    };
  } else if (Number.isFinite(Number(light)) && Number(light) <= 8) {
    alert = {
      id: `ALT-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      ts: isoNow(),
      nodeId: record.nodeId,
      gatewayId: record.gatewayId,
      severity: 'info',
      rule: 'low_light',
      message: `Luminosidade muito baixa em ${record.nodeId}: ${light}%`,
      resolved: false
    };
  } else if (Number.isFinite(Number(gas)) && Number(gas) >= 60) {
    alert = {
      id: `ALT-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      ts: isoNow(),
      nodeId: record.nodeId,
      gatewayId: record.gatewayId,
      severity: 'warning',
      rule: 'gas_high',
      message: `CO elevado em ${record.nodeId}: ${Number(gas).toFixed(1)} ppm`,
      resolved: false
    };
  }

  if (alert) {
    state.alerts.unshift(alert);
    state.alerts = state.alerts.slice(0, 50);
    state.metrics.alertsRaised += 1;
    scheduleSave();
    broadcast({ type: 'alert', payload: alert });
  }
}

function broadcast(event) {
  const message = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) {
    client.write(message);
  }
}

function simulateTick() {
  const activeNodes = state.nodes.filter((node) => node.status !== 'offline');
  const node = activeNodes[Math.floor(Math.random() * activeNodes.length)];
  if (!node) {
    return;
  }
  const record = createTelemetryRecord(node);
  registerTelemetry(record, 'simulation');
}

function getSummary() {
  const latest = state.telemetry[state.telemetry.length - 1] || null;
  const temperatures = state.telemetry
    .map((item) => getTemperatureReading(item))
    .filter((value) => typeof value === 'number');
  const avgTemperature = temperatures.length
    ? toNumber(temperatures.reduce((sum, value) => sum + value, 0) / temperatures.length, 1)
    : null;

  return {
    machine: 'single-node-backend',
    nodesTotal: state.nodes.length,
    nodesOnline: countOnlineNodes(),
    alertsOpen: state.alerts.filter((alert) => !alert.resolved).length,
    telemetryCount: state.telemetry.length,
    avgTemperature,
    latestTimestamp: latest ? latest.ts : null,
    metrics: state.metrics
  };
}

function markNodeOfflineIfStale() {
  const cutoff = Date.now() - 20 * 60 * 1000;
  for (const node of state.nodes) {
    const lastSeen = new Date(node.lastSeen).getTime();
    if (Number.isFinite(lastSeen) && lastSeen < cutoff && node.status !== 'offline') {
      node.status = 'offline';
      const alert = {
        id: `ALT-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        ts: isoNow(),
        nodeId: node.nodeId,
        gatewayId: node.gatewayId,
        severity: 'critical',
        rule: 'node_offline',
        message: `${node.nodeId} ficou offline`,
        resolved: false
      };
      state.alerts.unshift(alert);
      state.alerts = state.alerts.slice(0, 50);
      state.metrics.alertsRaised += 1;
      broadcast({ type: 'alert', payload: alert });
      scheduleSave();
    }
  }
}

function startSimulation() {
  setInterval(() => {
    simulateTick();
  }, SIMULATION_INTERVAL_MS);

  setInterval(() => {
    markNodeOfflineIfStale();
  }, 60 * 1000);
}

async function handlePostCommand(req, res) {
  let body;
  try {
    body = parseJsonBody(await readRequestBody(req));
  } catch (error) {
    sendBadRequest(res, 'JSON invalido');
    return;
  }

  const { nodeId, action, params = {} } = body;
  if (!nodeId || !action) {
    sendBadRequest(res, 'Campos nodeId e action sao obrigatorios');
    return;
  }

  const node = state.nodes.find((item) => item.nodeId === nodeId);
  if (!node) {
    sendBadRequest(res, 'nodeId nao encontrado');
    return;
  }

  const command = {
    commandId: `CMD-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    deviceId: node.deviceId,
    nodeId: node.nodeId,
    gatewayId: node.gatewayId,
    ts: isoNow(),
    seq: node.seq + 1,
    action,
    params,
    status: 'sent',
    ack: null
  };

  state.commands.unshift(command);
  state.commands = state.commands.slice(0, 50);
  state.metrics.commandsSent += 1;
  scheduleSave();
  broadcast({ type: 'command', payload: command });

  if (apiBrokerClient) {
    const topic = buildCommandTopic({ gatewayId: command.gatewayId, nodeId: command.nodeId });
    try {
      apiBrokerClient.publish(topic, command);
    } catch (err) {
      console.error('Failed to publish command to broker', err && err.message);
    }
    if (DB) {
      try {
        await DB.insertCommand(command);
      } catch (error) {
        console.error('DB insertCommand error', error && error.message);
      }
    }
    // command ACK will be handled asynchronously by the gateway/node and the ingest service
    sendJson(res, 202, command);
    return;
  }

  // Fallback: simulate ACK locally (existing behavior)
  setTimeout(() => {
    command.status = 'acked';
    command.ack = {
      ts: isoNow(),
      result: 'ok',
      detail: `Comando ${action} aplicado em ${nodeId}`
    };
    state.metrics.commandAcks += 1;
    scheduleSave();
    broadcast({ type: 'command-ack', payload: command });
  }, COMMAND_ACK_DELAY_MS);

  sendJson(res, 202, command);
}

async function handlePostIngest(req, res) {
  let body;
  try {
    body = parseJsonBody(await readRequestBody(req));
  } catch (error) {
    sendBadRequest(res, 'JSON invalido');
    return;
  }

  // If API is connected to broker, publish to MQTT and also register locally for UI
  if (apiBrokerClient) {
    const normalized = normalizeTelemetryPayload(body);
    if (!normalized) {
      sendBadRequest(res, 'Payload de telemetria invalido');
      return;
    }
    const topic = buildTelemetryTopic({ gatewayId: normalized.gatewayId, nodeId: normalized.nodeId });
    try {
      apiBrokerClient.publish(topic, normalized);
    } catch (err) {
      console.error('Failed to publish telemetry to broker', err && err.message);
    }
    // keep local state in sync for the existing UI
    registerTelemetry(normalized, 'http-ingest');
    if (DB) {
      try {
        await DB.insertTelemetry(normalized, 'http-ingest');
      } catch (error) {
        console.error('DB insertTelemetry error', error && error.message);
      }
    }
    sendJson(res, 202, { ok: true, receivedAt: isoNow() });
    return;
  }

  const accepted = registerTelemetry(body, 'esp32');
  if (!accepted) {
    sendBadRequest(res, 'Payload de telemetria invalido');
    return;
  }

  sendJson(res, 202, {
    ok: true,
    receivedAt: isoNow()
  });

  if (DB) {
    try {
      const normalizedBody = normalizeTelemetryPayload(body);
      if (normalizedBody) {
        await DB.insertTelemetry(normalizedBody, 'http-ingest');
      }
    } catch (error) {
      console.error('DB insertTelemetry error', error && error.message);
    }
  }
}

async function handleRequest(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const { pathname, searchParams } = parsedUrl;

  if (!requireAuth(req, res, pathname)) {
    return;
  }

  if (pathname === '/' || pathname === '/index.html') {
    const session = getSession(req);
    serveFile(res, path.join(PUBLIC_DIR, session.user ? 'index.html' : 'login.html'));
    return;
  }

  if (pathname === '/login') {
    serveFile(res, path.join(PUBLIC_DIR, 'login.html'));
    return;
  }

  if (pathname === '/logout') {
    const session = getSession(req);
    clearSession(session.token);
    clearAuthCookie(res);
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  if (pathname.startsWith('/public/')) {
    const assetPath = path.join(__dirname, pathname);
    if (assetPath.startsWith(PUBLIC_DIR)) {
      serveFile(res, assetPath);
      return;
    }
  }

  if (pathname === '/api/health') {
    sendJson(res, 200, {
      ok: true,
      ts: isoNow(),
      mode: 'single-machine-backend',
      uptime_s: Math.round(process.uptime())
    });
    return;
  }

  if (pathname === '/api/me') {
    const session = getSession(req);
    sendJson(res, 200, {
      authenticated: Boolean(session.user),
      user: session.user ? getSafeUser(session.user) : null
    });
    return;
  }

  if (pathname === '/api/login' && req.method === 'POST') {
    handlePostLogin(req, res).catch((error) => {
      console.error(error);
      sendJson(res, 500, { error: 'Erro ao autenticar' });
    });
    return;
  }

  if (pathname === '/api/summary') {
    if (DB) {
      try {
        const s = await DB.summary();
        sendJson(res, 200, s);
      } catch (error) {
        console.error('DB summary error', error && error.message);
        sendJson(res, 200, getSummary());
      }
    } else {
      sendJson(res, 200, getSummary());
    }
    return;
  }

  if (pathname === '/api/esp') {
    if (req.method === 'GET') {
      if (DB) {
        try {
          const nodes = await DB.loadNodes();
          sendJson(res, 200, { nodes });
        } catch (error) {
          console.error('DB loadNodes error', error && error.message);
          sendJson(res, 200, { nodes: getLatestByNode() });
        }
      } else {
        sendJson(res, 200, { nodes: getLatestByNode() });
      }
      return;
    }
    if (req.method === 'POST') {
      if (!requireRole(req, res, ['admin'])) {
        return;
      }
      handlePostEsp(req, res).catch((error) => {
        console.error(error);
        sendJson(res, 500, { error: 'Erro ao cadastrar ESP' });
      });
      return;
    }
  }

  if (pathname.startsWith('/api/esp/') && req.method === 'PATCH') {
    if (!requireRole(req, res, ['admin'])) {
      return;
    }
    handlePatchEsp(req, res, pathname.split('/').pop()).catch((error) => {
      console.error(error);
      sendJson(res, 500, { error: 'Erro ao atualizar ESP' });
    });
    return;
  }

  if (pathname.startsWith('/api/esp/') && req.method === 'DELETE') {
    if (!requireRole(req, res, ['admin'])) {
      return;
    }
    handleDeleteEsp(req, res, pathname.split('/').pop()).catch((error) => {
      console.error(error);
      sendJson(res, 500, { error: 'Erro ao remover ESP' });
    });
    return;
  }

  if (pathname === '/api/db-config') {
    if (req.method === 'GET') {
      if (!requireRole(req, res, ['admin'])) {
        return;
      }
      sendJson(res, 200, {
        database: sanitizeDbConfigForResponse(systemConfig.database, true)
      });
      return;
    }

    if (req.method === 'PUT') {
      if (!requireRole(req, res, ['admin'])) {
        return;
      }
      handlePutDbConfig(req, res).catch((error) => {
        console.error(error);
        sendJson(res, 500, { error: 'Erro ao salvar configuracao do banco' });
      });
      return;
    }
  }

  if (pathname === '/api/users') {
    if (req.method === 'GET') {
      if (!requireRole(req, res, ['admin'])) {
        return;
      }
      sendJson(res, 200, { users: users.map(getSafeUser) });
      return;
    }
    if (req.method === 'POST') {
      if (!requireRole(req, res, ['admin'])) {
        return;
      }
      handlePostUser(req, res).catch((error) => {
        console.error(error);
        sendJson(res, 500, { error: 'Erro ao cadastrar usuario' });
      });
      return;
    }
  }

  if (pathname.startsWith('/api/users/') && req.method === 'PATCH') {
    if (!requireRole(req, res, ['admin'])) {
      return;
    }
    handlePatchUser(req, res, pathname.split('/').pop()).catch((error) => {
      console.error(error);
      sendJson(res, 500, { error: 'Erro ao atualizar usuario' });
    });
    return;
  }

  if (pathname.startsWith('/api/users/') && req.method === 'DELETE') {
    if (!requireRole(req, res, ['admin'])) {
      return;
    }
    handleDeleteUser(req, res, pathname.split('/').pop()).catch((error) => {
      console.error(error);
      sendJson(res, 500, { error: 'Erro ao remover usuario' });
    });
    return;
  }

  if (pathname === '/api/nodes') {
    if (DB) {
      try {
        const nodes = await DB.loadNodes();
        sendJson(res, 200, { nodes });
      } catch (error) {
        console.error('DB loadNodes error', error && error.message);
        sendJson(res, 200, { nodes: getLatestByNode() });
      }
    } else {
      sendJson(res, 200, {
        nodes: getLatestByNode()
      });
    }
    return;
  }

  if (pathname === '/api/telemetry') {
    const nodeId = searchParams.get('nodeId');
    const limit = Number(searchParams.get('limit') || 30);
    if (DB) {
      try {
        const telemetry = await DB.loadTelemetry({ nodeId, limit });
        sendJson(res, 200, { telemetry });
      } catch (error) {
        console.error('DB loadTelemetry error', error && error.message);
        const telemetry = nodeId ? getRecentTelemetry(nodeId, limit) : state.telemetry.slice(-limit);
        sendJson(res, 200, { telemetry });
      }
    } else {
      const telemetry = nodeId ? getRecentTelemetry(nodeId, limit) : state.telemetry.slice(-limit);
      sendJson(res, 200, { telemetry });
    }
    return;
  }

  if (pathname === '/api/ingest' && req.method === 'POST') {
    handlePostIngest(req, res).catch((error) => {
      console.error(error);
      sendJson(res, 500, { error: 'Erro ao processar telemetria' });
    });
    return;
  }

  if (pathname === '/api/alerts') {
    const openOnly = searchParams.get('openOnly') === '1';
    if (DB) {
      try {
        const alerts = await DB.loadAlerts(openOnly);
        sendJson(res, 200, { alerts });
      } catch (error) {
        console.error('DB loadAlerts error', error && error.message);
        const alerts = openOnly ? state.alerts.filter((alert) => !alert.resolved) : state.alerts;
        sendJson(res, 200, { alerts });
      }
    } else {
      const alerts = openOnly ? state.alerts.filter((alert) => !alert.resolved) : state.alerts;
      sendJson(res, 200, { alerts });
    }
    return;
  }

  if (pathname === '/api/commands') {
    if (req.method === 'GET') {
      if (DB) {
        try {
          const commands = await DB.loadCommands();
          sendJson(res, 200, { commands });
        } catch (error) {
          console.error('DB loadCommands error', error && error.message);
          sendJson(res, 200, { commands: state.commands });
        }
      } else {
        sendJson(res, 200, { commands: state.commands });
      }
      return;
    }
    if (req.method === 'POST') {
      if (!requireRole(req, res, ['admin', 'operator'])) {
        return;
      }
      handlePostCommand(req, res).catch((error) => {
        console.error(error);
        sendJson(res, 500, { error: 'Erro ao processar comando' });
      });
      return;
    }
  }

  if (pathname === '/api/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'keep-alive'
    });
    res.write(`data: ${JSON.stringify({ type: 'hello', payload: getSummary() })}\n\n`);
    clients.add(res);
    req.on('close', () => {
      clients.delete(res);
    });
    return;
  }

  if (pathname === '/api/reset' && req.method === 'POST') {
    if (!requireRole(req, res, ['admin'])) {
      return;
    }
    state = defaultState();
    scheduleSave();
    broadcast({ type: 'summary', payload: getSummary() });
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === '/api/seed' && req.method === 'POST') {
    if (!requireRole(req, res, ['admin'])) {
      return;
    }
    for (let i = 0; i < 4; i += 1) {
      simulateTick();
    }
    sendJson(res, 200, { ok: true });
    return;
  }

  sendNotFound(res);
}

async function handlePostLogin(req, res) {
  let body;
  try {
    body = parseJsonBody(await readRequestBody(req));
  } catch (error) {
    sendBadRequest(res, 'JSON invalido');
    return;
  }

  const username = String(body.username || '').trim();
  const password = String(body.password || '');

  const user = findUserByUsername(username);
  if (!user || !user.active || !verifyPassword(password, user.salt, user.passwordHash)) {
    sendUnauthorized(res, 'Credenciais invalidas');
    return;
  }

  const token = createSession(getSafeUser(user));
  setAuthCookie(res, token);
  sendJson(res, 200, {
    ok: true,
    user: getSafeUser(user)
  });
}

async function handlePostUser(req, res) {
  let body;
  try {
    body = parseJsonBody(await readRequestBody(req));
  } catch (error) {
    sendBadRequest(res, 'JSON invalido');
    return;
  }

  const username = String(body.username || '').trim();
  const password = String(body.password || '').trim();
  const displayName = String(body.displayName || '').trim();
  const role = normalizeRole(body.role);

  if (!username || !password) {
    sendBadRequest(res, 'username e password sao obrigatorios');
    return;
  }

  if (findUserByUsername(username)) {
    sendBadRequest(res, 'Usuario ja existe');
    return;
  }

  const user = createUser({ username, password, displayName, role });
  users.push(user);
  scheduleUsersSave();
  sendJson(res, 201, { user: getSafeUser(user) });
}

async function handlePostEsp(req, res) {
  let body;
  try {
    body = parseJsonBody(await readRequestBody(req));
  } catch (error) {
    sendBadRequest(res, 'JSON invalido');
    return;
  }

  const nodeId = String(body.nodeId || '').trim();
  const deviceId = String(body.deviceId || '').trim();
  const gatewayId = String(body.gatewayId || '').trim() || 'GW01';
  const name = String(body.name || '').trim() || nodeId;
  const location = String(body.location || '').trim() || 'indefinido';
  const samplingIntervalSec = Number(body.samplingIntervalSec || 300);

  if (!nodeId || !deviceId) {
    sendBadRequest(res, 'nodeId e deviceId sao obrigatorios');
    return;
  }

  if (state.nodes.some((node) => node.nodeId === nodeId)) {
    sendBadRequest(res, 'nodeId ja cadastrado');
    return;
  }

  if (state.nodes.some((node) => node.deviceId === deviceId)) {
    sendBadRequest(res, 'deviceId ja cadastrado');
    return;
  }

  const node = {
    nodeId,
    deviceId,
    gatewayId,
    name,
    location,
    status: 'offline',
    seq: 0,
    rssi: -60,
    battery: 0,
    lastSeen: isoNow(),
    samplingIntervalSec: Number.isFinite(samplingIntervalSec) ? samplingIntervalSec : 300
  };

  state.nodes.push(node);
  scheduleSave();
  sendJson(res, 201, { node });
}

async function handlePatchEsp(req, res, nodeId) {
  let body;
  try {
    body = parseJsonBody(await readRequestBody(req));
  } catch (error) {
    sendBadRequest(res, 'JSON invalido');
    return;
  }

  const node = state.nodes.find((item) => item.nodeId === nodeId);
  if (!node) {
    sendNotFound(res);
    return;
  }

  if (body.name !== undefined) {
    node.name = String(body.name || node.name).trim() || node.name;
  }
  if (body.location !== undefined) {
    node.location = String(body.location || node.location).trim() || node.location;
  }
  if (body.gatewayId !== undefined) {
    node.gatewayId = String(body.gatewayId || node.gatewayId).trim() || node.gatewayId;
  }
  if (body.samplingIntervalSec !== undefined && Number.isFinite(Number(body.samplingIntervalSec))) {
    node.samplingIntervalSec = Number(body.samplingIntervalSec);
  }
  if (body.status !== undefined) {
    node.status = String(body.status || node.status);
  }

  scheduleSave();
  sendJson(res, 200, { node });
}

async function handleDeleteEsp(req, res, nodeId) {
  const exists = state.nodes.some((item) => item.nodeId === nodeId);
  if (!exists) {
    sendNotFound(res);
    return;
  }

  state.nodes = state.nodes.filter((item) => item.nodeId !== nodeId);
  state.telemetry = state.telemetry.filter((item) => item.nodeId !== nodeId);
  scheduleSave();
  sendJson(res, 200, { ok: true });
}

async function handlePutDbConfig(req, res) {
  let body;
  try {
    body = parseJsonBody(await readRequestBody(req));
  } catch (error) {
    sendBadRequest(res, 'JSON invalido');
    return;
  }

  const input = body && body.database ? body.database : body;
  if (!input || typeof input !== 'object') {
    sendBadRequest(res, 'Payload de configuracao invalido');
    return;
  }

  const current = (systemConfig && systemConfig.database) || defaultSystemConfig().database;
  const next = {
    ...current,
    ...input,
    enabled: Boolean(input.enabled ?? current.enabled),
    ssl: Boolean(input.ssl ?? current.ssl),
    port: Number.isFinite(Number(input.port)) ? Number(input.port) : current.port,
    retentionDays: Number.isFinite(Number(input.retentionDays)) ? Number(input.retentionDays) : current.retentionDays
  };

  systemConfig = {
    ...(systemConfig || defaultSystemConfig()),
    database: next
  };
  scheduleConfigSave();

  sendJson(res, 200, {
    database: sanitizeDbConfigForResponse(systemConfig.database, true)
  });
}

async function handlePatchUser(req, res, userId) {
  let body;
  try {
    body = parseJsonBody(await readRequestBody(req));
  } catch (error) {
    sendBadRequest(res, 'JSON invalido');
    return;
  }

  const user = findUserById(userId);
  if (!user) {
    sendNotFound(res);
    return;
  }

  updateUser(user, body);
  scheduleUsersSave();
  sendJson(res, 200, { user: getSafeUser(user) });
}

async function handleDeleteUser(req, res, userId) {
  const user = findUserById(userId);
  if (!user) {
    sendNotFound(res);
    return;
  }

  if (req.user && req.user.id === user.id) {
    sendBadRequest(res, 'Nao e permitido remover o proprio usuario');
    return;
  }

  users = users.filter((item) => item.id !== user.id);
  scheduleUsersSave();
  sendJson(res, 200, { ok: true });
}

async function boot() {
  ensureDataDir();
  readStateFromDisk();
  readUsersFromDisk();
  readSystemConfigFromDisk();

  if (systemConfig && systemConfig.database && systemConfig.database.enabled) {
    try {
      DB = createPostgresStore(systemConfig.database);
      if (DB && DB.ensureSchema) {
        await DB.ensureSchema();
        console.log('Database schema ensured');
      }
    } catch (error) {
      console.error('Failed to init DB store', error && error.message);
      DB = null;
    }
  }

  startSimulation();

  const server = http.createServer(handleRequest);
  server.listen(PORT, () => {
    console.log(`Trabalho Final rodando em http://localhost:${PORT}`);
  });
}

boot().catch((err) => {
  console.error('Boot failed', err && err.message);
  process.exit(1);
});
