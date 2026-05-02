const net = require('net');
const EventEmitter = require('events');

function parseLine(buffer) {
  try {
    return JSON.parse(buffer.toString('utf8'));
  } catch (err) {
    return null;
  }
}

class SimpleBrokerClient extends EventEmitter {
  constructor() {
    super();
    this.socket = null;
    this.buffer = '';
  }

  connect(host = '127.0.0.1', port = 1883, options = {}) {
    this.socket = net.createConnection({ host, port }, () => {
      this.emit('connect');
    });

    this.socket.on('data', (chunk) => {
      this.buffer += chunk.toString('utf8');
      let idx;
      while ((idx = this.buffer.indexOf('\n')) >= 0) {
        const line = this.buffer.slice(0, idx).trim();
        this.buffer = this.buffer.slice(idx + 1);
        if (!line) continue;
        const msg = parseLine(Buffer.from(line));
        if (!msg) continue;
        if (msg.type === 'message') {
          this.emit('message', msg.topic, msg.payload);
        } else if (msg.type === 'ack') {
          this.emit('ack', msg);
        } else if (msg.type === 'info') {
          this.emit('info', msg);
        }
      }
    });

    this.socket.on('close', () => this.emit('close'));
    this.socket.on('error', (err) => this.emit('error', err));
  }

  send(obj) {
    if (!this.socket || this.socket.destroyed) return;
    try {
      this.socket.write(JSON.stringify(obj) + '\n');
    } catch (err) {
      this.emit('error', err);
    }
  }

  subscribe(topic) {
    this.send({ type: 'subscribe', topic });
  }

  publish(topic, payload) {
    this.send({ type: 'publish', topic, payload });
  }

  end() {
    if (this.socket) this.socket.end();
  }
}

function createSimpleClient(url = 'tcp://127.0.0.1:1883') {
  try {
    const u = new URL(url);
    const host = u.hostname || '127.0.0.1';
    const port = Number(u.port || 1883);
    const client = new SimpleBrokerClient();
    client.connect(host, port);
    return client;
  } catch (err) {
    // fallback parse
    const parts = url.replace('tcp://', '').split(':');
    const host = parts[0] || '127.0.0.1';
    const port = Number(parts[1] || 1883);
    const client = new SimpleBrokerClient();
    client.connect(host, port);
    return client;
  }
}

module.exports = { createSimpleClient };
