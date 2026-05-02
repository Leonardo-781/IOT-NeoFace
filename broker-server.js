const net = require('net');
const http = require('http');
const os = require('os');

const BROKER_PORT = Number(process.env.BROKER_PORT || 1883);
const HEALTH_PORT = Number(process.env.BROKER_HEALTH_PORT || 1884);

// topic -> Set of sockets
const subscriptions = new Map();
// track sockets -> set of topics
const clientTopics = new Map();

function sendLine(socket, obj) {
  try {
    socket.write(JSON.stringify(obj) + '\n');
  } catch (err) {
    // ignore
  }
}

function matchTopic(subTopic, topic) {
  if (subTopic === topic) return true;
  // support single-level wildcard + and multi-level #
  const sParts = subTopic.split('/');
  const tParts = topic.split('/');
  for (let i = 0; i < sParts.length; i++) {
    const sp = sParts[i];
    const tp = tParts[i];
    if (sp === '#') return true;
    if (sp === '+') continue;
    if (tp === undefined) return false;
    if (sp !== tp) return false;
  }
  return sParts.length === tParts.length;
}

function forwardMessage(topic, payload, originSocket) {
  for (const [sub, sockets] of subscriptions.entries()) {
    if (!matchTopic(sub, topic)) continue;
    for (const sock of sockets) {
      if (sock.destroyed) continue;
      // don't send back to origin if origin is same socket
      sendLine(sock, { type: 'message', topic, payload });
    }
  }
}

const server = net.createServer((socket) => {
  socket.setEncoding('utf8');
  socket._buf = '';
  clientTopics.set(socket, new Set());

  socket.on('data', (chunk) => {
    socket._buf += chunk.toString();
    let idx;
    while ((idx = socket._buf.indexOf('\n')) >= 0) {
      const line = socket._buf.slice(0, idx).trim();
      socket._buf = socket._buf.slice(idx + 1);
      if (!line) continue;
      let msg = null;
      try {
        msg = JSON.parse(line);
      } catch (err) {
        // ignore invalid
        continue;
      }

      if (msg.type === 'subscribe' && typeof msg.topic === 'string') {
        const set = subscriptions.get(msg.topic) || new Set();
        set.add(socket);
        subscriptions.set(msg.topic, set);
        clientTopics.get(socket).add(msg.topic);
        sendLine(socket, { type: 'info', status: 'subscribed', topic: msg.topic });
        continue;
      }

      if (msg.type === 'unsubscribe' && typeof msg.topic === 'string') {
        const set = subscriptions.get(msg.topic);
        if (set) {
          set.delete(socket);
        }
        clientTopics.get(socket).delete(msg.topic);
        sendLine(socket, { type: 'info', status: 'unsubscribed', topic: msg.topic });
        continue;
      }

      if (msg.type === 'publish' && typeof msg.topic === 'string') {
        forwardMessage(msg.topic, msg.payload, socket);
        continue;
      }
    }
  });

  socket.on('close', () => {
    // cleanup
    const topics = clientTopics.get(socket) || new Set();
    for (const t of topics) {
      const set = subscriptions.get(t);
      if (set) set.delete(socket);
    }
    clientTopics.delete(socket);
  });

  socket.on('error', () => {});
});

server.listen(BROKER_PORT, () => {
  console.log(`Simple broker listening tcp://0.0.0.0:${BROKER_PORT}`);
});

const health = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/ready') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify(
        {
          ok: true,
          service: 'simple-broker',
          brokerPort: BROKER_PORT,
          topics: Array.from(subscriptions.keys()).slice(0, 50),
          ts: new Date().toISOString(),
          uptime_s: Math.round(process.uptime()),
          host: os.hostname()
        },
        null,
        2
      )
    );
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Not found' }, null, 2));
});

health.listen(HEALTH_PORT, () => {
  console.log(`Broker health endpoint on http://0.0.0.0:${HEALTH_PORT}/health`);
});

process.on('SIGINT', () => {
  health.close();
  server.close(() => process.exit(0));
});