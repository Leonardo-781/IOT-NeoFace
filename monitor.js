#!/usr/bin/env node

/**
 * Monitor de Saúde - Garante que os serviços permaneçam online
 * Reinicia automaticamente se algum cair
 * 
 * Uso: node monitor.js [--interval 30] [--quiet]
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const INTERVAL_SECS = parseInt(process.argv[2] || 30);
const QUIET = process.argv.includes('--quiet');

function getDatabaseHost() {
  try {
    const configPath = path.join(__dirname, 'data', 'system_config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config?.database?.host || '127.0.0.1';
  } catch {
    return '127.0.0.1';
  }
}

const databaseHost = getDatabaseHost();

const endpoints = [
  { name: 'Backend (3000)', url: 'http://localhost:3000/api/health' },
  { name: 'Gateway (3001)', url: 'http://localhost:3001/', method: 'GET' },
  { name: 'Broker (1884)', url: 'http://localhost:1884/health' },
  { name: 'PostgreSQL (5432)', host: databaseHost, port: 5432, tcp: true }
];

const failureThresholds = {};
const MAX_FAILURES = 3;

function log(msg) {
  if (!QUIET) {
    const now = new Date().toLocaleTimeString('pt-BR');
    console.log(`[${now}] ${msg}`);
  }
}

function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    if (endpoint.tcp) {
      // TCP test para PostgreSQL
      const net = require('net');
      const socket = net.createConnection(endpoint.port, endpoint.host);
      
      let connected = false;
      socket.on('connect', () => {
        connected = true;
        socket.destroy();
        resolve(true);
      });
      
      socket.on('error', () => {
        resolve(false);
      });
      
      setTimeout(() => {
        if (!connected) socket.destroy();
        resolve(false);
      }, 2000);
    } else {
      // HTTP test
      const url = new URL(endpoint.url);
      const options = {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname + url.search,
        method: endpoint.method || 'GET',
        timeout: 2000
      };

      const req = http.request(options, (res) => {
        resolve(res.statusCode < 500);
      });

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    }
  });
}

async function checkHealth() {
  const results = [];
  
  for (const endpoint of endpoints) {
    const healthy = await testEndpoint(endpoint);
    results.push({ endpoint, healthy });

    if (!healthy) {
      failureThresholds[endpoint.name] = (failureThresholds[endpoint.name] || 0) + 1;
    } else {
      failureThresholds[endpoint.name] = 0;
    }
  }

  const allHealthy = results.every(r => r.healthy);
  const failed = results.filter(r => !r.healthy).map(r => r.endpoint.name);

  if (allHealthy) {
    log('✓ Todos os serviços OK');
  } else {
    log(`⚠ Falhas detectadas: ${failed.join(', ')}`);
    
    // Verificar se atingiu threshold para reiniciar
    failed.forEach(name => {
      if (failureThresholds[name] >= MAX_FAILURES) {
        log(`🔴 ${name} falhou ${MAX_FAILURES}x - REINICIANDO TODOS OS SERVICOS`);
        try {
          execSync('pm2 restart all', { stdio: 'inherit' });
          failureThresholds[name] = 0;
          log('✓ Serviços reiniciados');
        } catch (err) {
          log(`✗ Erro ao reiniciar: ${err.message}`);
        }
      }
    });
  }
}

async function monitor() {
  log(`Monitor iniciado - verificando a cada ${INTERVAL_SECS}s`);
  log('Endpoints monitorados:');
  endpoints.forEach(ep => log(`  - ${ep.name}`));
  log('');

  // Check inicial
  await checkHealth();

  // Loop de monitoramento
  setInterval(checkHealth, INTERVAL_SECS * 1000);
}

monitor().catch(err => {
  console.error('Monitor error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  log('\nMonitor parado');
  process.exit(0);
});
