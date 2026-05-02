const summaryGrid = document.getElementById('summaryGrid');
const nodesList = document.getElementById('nodesList');
const alertsList = document.getElementById('alertsList');
const commandsList = document.getElementById('commandsList');
const nodeSelect = document.getElementById('nodeSelect');
const commandNode = document.getElementById('commandNode');
const commandForm = document.getElementById('commandForm');
const commandFeedback = document.getElementById('commandFeedback');
const commandParams = document.getElementById('commandParams');
const commandAction = document.getElementById('commandAction');
const chart = document.getElementById('chart');
const chartMetric = document.getElementById('chartMetric');
const chartSubtitle = document.getElementById('chartSubtitle');
const btnRefresh = document.getElementById('btnRefresh');
const btnSeed = document.getElementById('btnSeed');
const heroNodes = document.getElementById('heroNodes');
const heroActivity = document.getElementById('heroActivity');
const heroLatency = document.getElementById('heroLatency');
const heroAlerts = document.getElementById('heroAlerts');
const heroModeLabel = document.getElementById('heroModeLabel');
const statusUser = document.getElementById('statusUser');
const statusBackend = document.getElementById('statusBackend');
const statusGateway = document.getElementById('statusGateway');
const statusUpdated = document.getElementById('statusUpdated');
const statusInterface = document.getElementById('statusInterface');
const adminPanel = document.getElementById('adminPanel');
const userForm = document.getElementById('userForm');
const userFormFeedback = document.getElementById('userFormFeedback');
const newUsername = document.getElementById('newUsername');
const newDisplayName = document.getElementById('newDisplayName');
const newPassword = document.getElementById('newPassword');
const newRole = document.getElementById('newRole');
const usersList = document.getElementById('usersList');
const usersCount = document.getElementById('usersCount');
const espForm = document.getElementById('espForm');
const espNodeId = document.getElementById('espNodeId');
const espDeviceId = document.getElementById('espDeviceId');
const espGatewayId = document.getElementById('espGatewayId');
const espName = document.getElementById('espName');
const espLocation = document.getElementById('espLocation');
const espFormFeedback = document.getElementById('espFormFeedback');
const espList = document.getElementById('espList');
const espCount = document.getElementById('espCount');
const dbConfigForm = document.getElementById('dbConfigForm');
const dbEngine = document.getElementById('dbEngine');
const dbHost = document.getElementById('dbHost');
const dbPort = document.getElementById('dbPort');
const dbName = document.getElementById('dbName');
const dbUser = document.getElementById('dbUser');
const dbPassword = document.getElementById('dbPassword');
const dbRetention = document.getElementById('dbRetention');
const dbEnabled = document.getElementById('dbEnabled');
const dbSsl = document.getElementById('dbSsl');
const dbConfigFeedback = document.getElementById('dbConfigFeedback');
const ctx = chart.getContext('2d');

let latestState = {
  summary: null,
  nodes: [],
  telemetry: [],
  alerts: [],
  commands: [],
  users: []
};
let dbConfig = null;
let selectedNodeId = null;
let selectedChartMetric = chartMetric?.value || 'temperature';
let currentUser = null;
let activeRoleTheme = null;

const CHART_METRICS = {
  temperature: { label: 'Temperatura', unit: '°C' },
  pressure: { label: 'Pressão', unit: 'hPa' },
  humidity: { label: 'Umidade', unit: '%' },
  light: { label: 'Luz', unit: '%' },
  gas: { label: 'CO', unit: 'ppm' }
};

function formatTime(value) {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium'
  });
}

function getBmp280Sensor(sensors = {}) {
  return sensors.bmp280 || sensors.bme280 || {};
}

function getMetricValue(point, metric) {
  const bmp280 = getBmp280Sensor(point?.sensors || {});
  switch (metric) {
    case 'pressure':
      return bmp280.pressure_hpa ?? point?.sensors?.pressure_hpa ?? null;
    case 'humidity':
      return bmp280.humidity_pct ?? point?.sensors?.humidity_pct ?? null;
    case 'light':
      return point?.sensors?.ldr?.light_pct ?? point?.sensors?.light_pct ?? null;
    case 'gas':
      return point?.sensors?.mq7?.co_ppm ?? point?.sensors?.mq7?.gas_ppm ?? point?.sensors?.co_ppm ?? point?.sensors?.gas_ppm ?? null;
    case 'temperature':
    default:
      return bmp280.temperature_c ?? point?.sensors?.temperature_c ?? null;
  }
}

function getMetricLabel(metric) {
  return CHART_METRICS[metric]?.label || CHART_METRICS.temperature.label;
}

function getMetricUnit(metric) {
  return CHART_METRICS[metric]?.unit || '';
}

function buildSensorTiles(latest) {
  if (!latest) {
    return [];
  }

  const bmp280 = getBmp280Sensor(latest.sensors || {});
  const tiles = [];
  const temperature = bmp280.temperature_c ?? latest?.sensors?.temperature_c;
  const pressure = bmp280.pressure_hpa ?? latest?.sensors?.pressure_hpa;
  const humidity = bmp280.humidity_pct ?? latest?.sensors?.humidity_pct;
  const light = latest?.sensors?.ldr?.light_pct ?? latest?.sensors?.light_pct;
  const gas = latest?.sensors?.mq7?.co_ppm ?? latest?.sensors?.mq7?.gas_ppm ?? latest?.sensors?.co_ppm ?? latest?.sensors?.gas_ppm;
  const rgb = latest?.actuators?.rgb_led || latest?.outputs?.rgb_led;

  if (Number.isFinite(Number(temperature))) {
    tiles.push({ label: 'Temperatura', value: `${Number(temperature).toFixed(1)} °C`, accent: 'temp' });
  }
  if (Number.isFinite(Number(pressure))) {
    tiles.push({ label: 'Pressão', value: `${Number(pressure).toFixed(1)} hPa`, accent: 'light' });
  }
  if (Number.isFinite(Number(humidity))) {
    tiles.push({ label: 'Umidade', value: `${Number(humidity).toFixed(1)} %`, accent: 'online' });
  }
  if (Number.isFinite(Number(light))) {
    tiles.push({ label: 'Luz', value: `${Number(light).toFixed(0)} %`, accent: 'warning' });
  }
  if (Number.isFinite(Number(gas))) {
    tiles.push({ label: 'CO', value: `${Number(gas).toFixed(1)} ppm`, accent: 'warning' });
  }
  if (rgb) {
    const rgbLabel = rgb.color || rgb.state || 'indefinido';
    tiles.push({ label: 'RGB LED', value: String(rgbLabel).toUpperCase(), accent: 'online' });
  }

  return tiles;
}

function getLatestReading(node) {
  return node.latest || null;
}

function renderSummary(summary) {
  const onlineNodes = summary?.nodesOnline ?? 0;
  const totalNodes = summary?.nodesTotal ?? 0;
  const userLabel = currentUser ? `${currentUser.displayName || currentUser.username} (${currentUser.role})` : 'convidado';
  heroNodes.textContent = `${onlineNodes}/${totalNodes} nós online`;
  heroActivity.textContent = summary?.latestTimestamp
    ? `Última leitura recebida em ${formatTime(summary.latestTimestamp)}`
    : 'Nenhuma telemetria recebida ainda';
  heroLatency.textContent = `${Math.max(8, Math.round(10 + Math.random() * 12))} ms`;
  heroAlerts.textContent = String(summary?.alertsOpen ?? 0);
  statusUser.textContent = userLabel;
  statusBackend.textContent = 'Online';
  statusGateway.textContent = 'GW01';
  statusUpdated.textContent = summary?.latestTimestamp ? formatTime(summary.latestTimestamp) : '-';

  const items = [
    { label: 'Nós online', value: onlineNodes, hint: `${totalNodes} nós cadastrados`, accent: 'online' },
    { label: 'Telemetrias', value: summary?.telemetryCount ?? 0, hint: 'Mensagens armazenadas', accent: 'temp' },
    { label: 'Alertas abertos', value: summary?.alertsOpen ?? 0, hint: 'Regras ativas', accent: 'warning' },
    { label: 'Temp. média', value: summary?.avgTemperature == null ? '--' : `${summary.avgTemperature} °C`, hint: summary?.latestTimestamp ? `Última leitura: ${formatTime(summary.latestTimestamp)}` : 'Sem dados ainda', accent: 'light' }
  ];

  summaryGrid.innerHTML = items
    .map(
      (item) => `
        <article class="metric">
          <div class="label">${item.label}</div>
          <div class="value">${item.value}</div>
          <div class="hint">${item.hint}</div>
          <div class="metric-bar ${item.accent || ''}"></div>
        </article>
      `
    )
    .join('');
}

function renderNodes(nodes) {
  if (!selectedNodeId && nodes.length) {
    selectedNodeId = nodes[0].nodeId;
  }

  const options = nodes
    .map((node) => `<option value="${node.nodeId}">${node.nodeId} - ${node.name}</option>`)
    .join('');
  nodeSelect.innerHTML = options;
  commandNode.innerHTML = options;
  if (selectedNodeId) {
    nodeSelect.value = selectedNodeId;
    commandNode.value = selectedNodeId;
  }

  nodesList.innerHTML = nodes
    .map((node) => {
      const latest = getLatestReading(node);
      const badgeClass = node.status === 'online' ? 'online' : 'offline';
      const sensorTiles = buildSensorTiles(latest);
      return `
        <article class="card node-card" data-status="${node.status}">
          <div class="card-top">
            <strong>${node.nodeId}</strong>
            <span class="badge ${badgeClass}">${node.status}</span>
          </div>
          <div class="meta">${node.name} · ${node.location}</div>
          <div class="meta">Gateway: ${node.gatewayId} · Seq: ${node.seq} · RSSI: ${node.rssi} dBm</div>
          <div class="node-metrics">
            ${sensorTiles.length
              ? sensorTiles
                  .map(
                    (item) => `
                      <div class="node-metric">
                        <span>${item.label}</span>
                        <strong>${item.value}</strong>
                      </div>
                    `
                  )
                  .join('')
              : '<div class="node-metric"><span>Leituras</span><strong>Sem dados</strong></div>'}
          </div>
          <div class="meta">Bateria: ${node.battery} V · Último visto: ${formatTime(node.lastSeen)}</div>
        </article>
      `;
    })
    .join('');
}

function renderAlerts(alerts) {
  const data = alerts.length ? alerts : [{ message: 'Nenhum alerta ativo', severity: 'info', ts: null, rule: 'none', nodeId: '-', gatewayId: '-' }];
  alertsList.innerHTML = data
    .map((alert) => {
      const badgeClass = alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'online';
      return `
        <article class="card alert-card alert-${badgeClass}">
          <div class="card-top">
            <strong>${alert.rule}</strong>
            <span class="badge ${badgeClass}">${alert.severity}</span>
          </div>
          <div class="meta">${alert.message}</div>
          <div class="meta">${alert.nodeId} · ${alert.gatewayId} · ${formatTime(alert.ts)}</div>
        </article>
      `;
    })
    .join('');
}

function renderCommands(commands) {
  const data = commands.length ? commands : [{ action: 'nenhum comando enviado', status: 'idle', nodeId: '-', ts: null, ack: null }];
  commandsList.innerHTML = data
    .map((command) => {
      const stateLabel = command.status || 'idle';
      return `
        <article class="card">
          <div class="card-top">
            <strong>${command.commandId || command.action}</strong>
            <span class="badge ${stateLabel === 'acked' ? 'online' : 'warning'}">${stateLabel}</span>
          </div>
          <div class="meta">Nó: ${command.nodeId} · Ação: ${command.action || '-'}</div>
          <div class="meta">Enviado: ${formatTime(command.ts)}</div>
          <div class="meta">ACK: ${command.ack ? `${command.ack.result} · ${command.ack.detail}` : 'aguardando'}</div>
        </article>
      `;
    })
    .join('');
}

function renderUsers(users) {
  if (!usersList || !usersCount) {
    return;
  }

  usersCount.textContent = `${users.length} usuário${users.length === 1 ? '' : 's'}`;

  if (!users.length) {
    usersList.innerHTML = '<article class="card"><div class="meta">Nenhum usuário cadastrado.</div></article>';
    return;
  }

  usersList.innerHTML = users
    .map(
      (user) => `
        <article class="card user-card" data-user-id="${user.id}">
          <div class="user-card-top">
            <strong>${user.displayName || user.username}</strong>
            <div class="user-roles">
              <span class="pill ${user.role}">${user.role}</span>
              <span class="pill ${user.active ? 'active' : 'inactive'}">${user.active ? 'ativo' : 'inativo'}</span>
            </div>
          </div>
          <div class="meta">@${user.username} · criado em ${formatTime(user.createdAt)}</div>
          <div class="user-card-actions">
            <input class="user-display-name" type="text" value="${user.displayName || ''}" placeholder="Nome exibido" />
            <select class="user-role">
              <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>viewer</option>
              <option value="operator" ${user.role === 'operator' ? 'selected' : ''}>operator</option>
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>admin</option>
            </select>
            <input class="user-password" type="password" placeholder="Nova senha" />
            <label class="meta" style="display:flex;align-items:center;gap:8px;">
              <input class="user-active" type="checkbox" ${user.active ? 'checked' : ''} />
              ativo
            </label>
            <button type="button" class="secondary user-save">Salvar</button>
            <button type="button" class="secondary user-delete">Remover</button>
          </div>
        </article>
      `
    )
    .join('');

  usersList.querySelectorAll('.user-save').forEach((button) => {
    button.addEventListener('click', saveUserFromCard);
  });
  usersList.querySelectorAll('.user-delete').forEach((button) => {
    button.addEventListener('click', deleteUserFromCard);
  });
}

function renderEspList(nodes) {
  if (!espList || !espCount) {
    return;
  }

  espCount.textContent = `${nodes.length} ESP${nodes.length === 1 ? '' : 's'}`;
  if (!nodes.length) {
    espList.innerHTML = '<article class="card"><div class="meta">Nenhum ESP cadastrado.</div></article>';
    return;
  }

  espList.innerHTML = nodes
    .map(
      (node) => `
        <article class="card user-card" data-node-id="${node.nodeId}">
          <div class="esp-card-top">
            <strong>${node.nodeId}</strong>
            <span class="pill ${node.status === 'online' ? 'active' : 'inactive'}">${node.status}</span>
          </div>
          <div class="meta">${node.deviceId} · ${node.gatewayId}</div>
          <div class="user-card-actions">
            <input class="esp-name" type="text" value="${node.name || ''}" placeholder="Nome" />
            <input class="esp-location" type="text" value="${node.location || ''}" placeholder="Local" />
            <input class="esp-gateway" type="text" value="${node.gatewayId || ''}" placeholder="Gateway" />
            <button type="button" class="secondary esp-save">Salvar</button>
            <button type="button" class="secondary esp-delete">Remover</button>
          </div>
        </article>
      `
    )
    .join('');

  espList.querySelectorAll('.esp-save').forEach((button) => {
    button.addEventListener('click', saveEspFromCard);
  });
  espList.querySelectorAll('.esp-delete').forEach((button) => {
    button.addEventListener('click', deleteEspFromCard);
  });
}

function renderDbConfig(config) {
  if (!dbConfigForm || !config) {
    return;
  }
  dbEngine.value = config.engine || 'timescaledb';
  dbHost.value = config.host || '';
  dbPort.value = Number(config.port || 5432);
  dbName.value = config.database || '';
  dbUser.value = config.username || '';
  dbPassword.value = config.password && config.password !== '***' ? config.password : '';
  dbRetention.value = Number(config.retentionDays || 30);
  dbEnabled.checked = Boolean(config.enabled);
  dbSsl.checked = Boolean(config.ssl);
}

function applyPermissionState() {
  const role = currentUser?.role || 'viewer';
  const canWrite = role === 'admin' || role === 'operator';
  const canAdmin = role === 'admin';

  applyRoleVisualState(role);

  if (commandForm) {
    commandForm.querySelectorAll('input, select, textarea, button').forEach((element) => {
      element.disabled = !canWrite;
    });
    commandFeedback.textContent = canWrite ? '' : 'Seu acesso é somente leitura.';
  }

  if (adminPanel) {
    adminPanel.hidden = !canAdmin;
  }
}

function applyRoleVisualState(role) {
  const prettyRole = role === 'admin' ? 'admin' : role === 'operator' ? 'operator' : 'viewer';
  document.body.setAttribute('data-role', prettyRole);

  if (heroModeLabel) {
    heroModeLabel.textContent = `Operação ao vivo · modo ${prettyRole}`;
  }
  if (statusInterface) {
    statusInterface.textContent = `Realtime · Dark · ${prettyRole}`;
  }

  if (activeRoleTheme !== prettyRole) {
    document.body.classList.remove('role-shift');
    void document.body.offsetWidth;
    document.body.classList.add('role-shift');
    activeRoleTheme = prettyRole;
  }
}

async function fetchSession() {
  const response = await fetch('/api/me');
  if (response.status === 401) {
    window.location.href = '/';
    return null;
  }
  const data = await response.json();
  currentUser = data.user;
  applyPermissionState();
  return currentUser;
}

async function fetchUsers() {
  if (!currentUser || currentUser.role !== 'admin') {
    renderUsers([]);
    return;
  }

  const response = await fetch('/api/users');
  if (response.status === 401 || response.status === 403) {
    userFormFeedback.textContent = 'Sem permissão para listar usuários';
    return;
  }

  const data = await response.json();
  latestState.users = data.users || [];
  renderUsers(latestState.users);
}

async function fetchEspList() {
  if (!currentUser || currentUser.role !== 'admin') {
    renderEspList([]);
    return;
  }

  const response = await fetch('/api/esp');
  if (!response.ok) {
    espFormFeedback.textContent = 'Falha ao carregar ESPs';
    return;
  }

  const data = await response.json();
  renderEspList(data.nodes || []);
}

async function fetchDbConfig() {
  if (!currentUser || currentUser.role !== 'admin') {
    return;
  }

  const response = await fetch('/api/db-config');
  if (!response.ok) {
    dbConfigFeedback.textContent = 'Falha ao carregar config do banco';
    return;
  }

  const data = await response.json();
  dbConfig = data.database || null;
  renderDbConfig(dbConfig);
}

async function saveUserFromCard(event) {
  const card = event.target.closest('.user-card');
  if (!card) {
    return;
  }

  const userId = card.dataset.userId;
  const payload = {
    displayName: card.querySelector('.user-display-name').value,
    role: card.querySelector('.user-role').value,
    active: card.querySelector('.user-active').checked
  };

  const password = card.querySelector('.user-password').value.trim();
  if (password) {
    payload.password = password;
  }

  const response = await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    userFormFeedback.textContent = error.error || 'Falha ao salvar usuário';
    return;
  }

  userFormFeedback.textContent = 'Usuário atualizado';
  await fetchUsers();
}

async function deleteUserFromCard(event) {
  const card = event.target.closest('.user-card');
  if (!card) {
    return;
  }

  const userId = card.dataset.userId;
  const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
  if (!response.ok) {
    const error = await response.json();
    userFormFeedback.textContent = error.error || 'Falha ao remover usuário';
    return;
  }

  userFormFeedback.textContent = 'Usuário removido';
  await fetchUsers();
}

async function saveEspFromCard(event) {
  const card = event.target.closest('[data-node-id]');
  if (!card) {
    return;
  }

  const nodeId = card.dataset.nodeId;
  const payload = {
    name: card.querySelector('.esp-name').value,
    location: card.querySelector('.esp-location').value,
    gatewayId: card.querySelector('.esp-gateway').value
  };

  const response = await fetch(`/api/esp/${nodeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    espFormFeedback.textContent = error.error || 'Falha ao atualizar ESP';
    return;
  }

  espFormFeedback.textContent = 'ESP atualizado';
  await fetchEspList();
}

async function deleteEspFromCard(event) {
  const card = event.target.closest('[data-node-id]');
  if (!card) {
    return;
  }

  const nodeId = card.dataset.nodeId;
  const response = await fetch(`/api/esp/${nodeId}`, { method: 'DELETE' });
  if (!response.ok) {
    const error = await response.json();
    espFormFeedback.textContent = error.error || 'Falha ao remover ESP';
    return;
  }

  espFormFeedback.textContent = 'ESP removido';
  await fetchEspList();
}

function buildChartData(nodeId) {
  return latestState.telemetry.filter((item) => item.nodeId === nodeId).slice(-24);
}

function drawChart(points) {
  const width = chart.width;
  const height = chart.height;
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = '#08111d';
  ctx.fillRect(0, 0, width, height);

  if (!points.length) {
    ctx.fillStyle = '#9db2cf';
    ctx.font = '20px Space Grotesk, sans-serif';
    ctx.fillText('Sem telemetria para exibir', 36, 52);
    return;
  }

  const metric = CHART_METRICS[selectedChartMetric] ? selectedChartMetric : 'temperature';
  const values = points
    .map((item) => ({ ts: item.ts, value: getMetricValue(item, metric) }))
    .filter((item) => Number.isFinite(Number(item.value)));

  if (!values.length) {
    ctx.fillStyle = '#9db2cf';
    ctx.font = '20px Space Grotesk, sans-serif';
    ctx.fillText(`Sem ${getMetricLabel(metric).toLowerCase()} para exibir`, 36, 52);
    return;
  }

  const series = values.map((item) => Number(item.value));
  const maxValue = Math.max(...series);
  const minValue = Math.min(...series);
  const padding = 42;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const step = innerWidth / Math.max(values.length - 1, 1);

  function plot(seriesValues, color, label) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    seriesValues.forEach((value, index) => {
      const x = padding + index * step;
      const y = padding + innerHeight - ((value - minValue) / (maxValue - minValue || 1)) * innerHeight;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    const lastValue = values[values.length - 1];
    const lastX = padding + (values.length - 1) * step;
    const lastY = padding + innerHeight - ((lastValue - minValue) / (maxValue - minValue || 1)) * innerHeight;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(label, lastX - 70, lastY - 14);
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = padding + (innerHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  plot(series, '#51d1c7', `${getMetricLabel(metric)} ${getMetricUnit(metric)}`.trim());

  ctx.fillStyle = '#9db2cf';
  ctx.font = '14px Inter, sans-serif';
  ctx.fillText(`Min ${minValue.toFixed(1)}`, 20, height - 20);
  ctx.fillText(`Max ${maxValue.toFixed(1)}`, 20, 24);
}

function syncState(data) {
  latestState = data;
  renderSummary(data.summary);
  renderNodes(data.nodes);
  renderAlerts(data.alerts);
  renderCommands(data.commands);

  const points = buildChartData(selectedNodeId || data.nodes[0]?.nodeId);
  const activeNode = data.nodes.find((node) => node.nodeId === selectedNodeId) || data.nodes[0];
  chartSubtitle.textContent = activeNode
    ? `${activeNode.nodeId} · ${activeNode.name} · ${points.length} pontos de ${getMetricLabel(selectedChartMetric).toLowerCase()}`
    : 'Sem nós cadastrados';
  drawChart(points);
}

async function fetchState() {
  const [summaryRes, nodesRes, telemetryRes, alertsRes, commandsRes] = await Promise.all([
    fetch('/api/summary'),
    fetch('/api/nodes'),
    fetch('/api/telemetry?limit=120'),
    fetch('/api/alerts?openOnly=0'),
    fetch('/api/commands')
  ]);

  const [summary, nodesData, telemetryData, alertsData, commandsData] = await Promise.all([
    summaryRes.json(),
    nodesRes.json(),
    telemetryRes.json(),
    alertsRes.json(),
    commandsRes.json()
  ]);

  if ([summaryRes, nodesRes, telemetryRes, alertsRes, commandsRes].some((response) => response.status === 401)) {
    window.location.href = '/';
    return;
  }

  syncState({
    summary,
    nodes: nodesData.nodes || [],
    telemetry: telemetryData.telemetry || [],
    alerts: alertsData.alerts || [],
    commands: commandsData.commands || []
  });

  if (currentUser?.role === 'admin') {
    await fetchUsers();
    await fetchEspList();
    await fetchDbConfig();
  }
}

async function submitCommand(event) {
  event.preventDefault();
  commandFeedback.textContent = 'Enviando...';

  let params;
  try {
    params = JSON.parse(commandParams.value || '{}');
  } catch (error) {
    commandFeedback.textContent = 'Parâmetro JSON inválido';
    return;
  }

  const payload = {
    nodeId: commandNode.value,
    action: commandAction.value.trim(),
    params
  };

  const response = await fetch('/api/commands', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    commandFeedback.textContent = error.error || 'Falha ao enviar comando';
    return;
  }

  commandFeedback.textContent = 'Comando enviado com sucesso';
  await fetchState();
}

function startEvents() {
  const source = new EventSource('/api/events');
  source.addEventListener('message', async () => {
    await fetchState();
  });
  source.addEventListener('error', () => {
    setTimeout(() => {
      source.close();
      startEvents();
    }, 2500);
  });
}

nodeSelect.addEventListener('change', (event) => {
  selectedNodeId = event.target.value;
  const points = buildChartData(selectedNodeId);
  const activeNode = latestState.nodes.find((node) => node.nodeId === selectedNodeId);
  chartSubtitle.textContent = activeNode
    ? `${activeNode.nodeId} · ${activeNode.name} · ${points.length} pontos de ${getMetricLabel(selectedChartMetric).toLowerCase()}`
    : 'Sem nós cadastrados';
  drawChart(points);
});

if (chartMetric) {
  chartMetric.addEventListener('change', (event) => {
    selectedChartMetric = event.target.value;
    const points = buildChartData(selectedNodeId || latestState.nodes[0]?.nodeId);
    const activeNode = latestState.nodes.find((node) => node.nodeId === selectedNodeId) || latestState.nodes[0];
    chartSubtitle.textContent = activeNode
      ? `${activeNode.nodeId} · ${activeNode.name} · ${points.length} pontos de ${getMetricLabel(selectedChartMetric).toLowerCase()}`
      : 'Sem nós cadastrados';
    drawChart(points);
  });
}

btnRefresh.addEventListener('click', fetchState);
btnSeed.addEventListener('click', async () => {
  btnSeed.disabled = true;
  await fetch('/api/seed', { method: 'POST' });
  await fetchState();
  btnSeed.disabled = false;
});
commandForm.addEventListener('submit', submitCommand);
if (userForm) {
  userForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    userFormFeedback.textContent = 'Cadastrando...';

    const payload = {
      username: newUsername.value.trim(),
      displayName: newDisplayName.value.trim(),
      password: newPassword.value,
      role: newRole.value
    };

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      userFormFeedback.textContent = error.error || 'Falha ao cadastrar usuário';
      return;
    }

    userFormFeedback.textContent = 'Usuário cadastrado';
    userForm.reset();
    newRole.value = 'viewer';
    await fetchUsers();
  });
}

if (espForm) {
  espForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    espFormFeedback.textContent = 'Cadastrando...';

    const payload = {
      nodeId: espNodeId.value.trim(),
      deviceId: espDeviceId.value.trim(),
      gatewayId: espGatewayId.value.trim(),
      name: espName.value.trim(),
      location: espLocation.value.trim()
    };

    const response = await fetch('/api/esp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      espFormFeedback.textContent = error.error || 'Falha ao cadastrar ESP';
      return;
    }

    espFormFeedback.textContent = 'ESP cadastrado';
    espForm.reset();
    espGatewayId.value = 'GW01';
    await fetchEspList();
    await fetchState();
  });
}

if (dbConfigForm) {
  dbConfigForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    dbConfigFeedback.textContent = 'Salvando...';

    const payload = {
      database: {
        engine: dbEngine.value,
        host: dbHost.value.trim(),
        port: Number(dbPort.value || 0),
        database: dbName.value.trim(),
        username: dbUser.value.trim(),
        password: dbPassword.value,
        retentionDays: Number(dbRetention.value || 0),
        enabled: dbEnabled.checked,
        ssl: dbSsl.checked
      }
    };

    const response = await fetch('/api/db-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      dbConfigFeedback.textContent = error.error || 'Falha ao salvar configuração';
      return;
    }

    const data = await response.json();
    dbConfig = data.database || null;
    renderDbConfig(dbConfig);
    dbConfigFeedback.textContent = 'Configuração do banco salva';
  });
}

fetchSession().then(() => {
  fetchState().then(() => {
    startEvents();
    setInterval(fetchState, 15000);
  });
});
