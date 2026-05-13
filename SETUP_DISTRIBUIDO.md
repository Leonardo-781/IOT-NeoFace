# Setup Distribuído em Dois Servidores 🚀

## Topologia Final

```
┌─────────────────────────────────────┐
│ RASPBERRY PI 3B                     │
│ ┌─────────────────────────────────┐ │
│ │ PostgreSQL 16                   │ │
│ │ :5432 (iot_monitoring)          │ │
│ │ 100.82.140.119                  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
              ▲
              │ TCP 5432 (Ethernet/LAN)
              │
┌─────────────────────────────────────┐
│ NOTEBOOK (Linux/Windows)            │
│ ┌─────────────────────────────────┐ │
│ │ Backend      :3000              │ │
│ │ Gateway      :3001              │ │
│ │ MQTT Broker  :1883              │ │
│ │ (Docker)                        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
              ▲
              │ HTTP/WebSocket
              │
        ESP32/ESP8266 (WiFi)
```

---

## 📋 PARTE 1: RASPBERRY PI - PostgreSQL

### 1.1 Instalação (SSH no Raspberry)

```bash
# SSH para o Raspberry
ssh pi@100.82.140.119
# senha: raspberry (padrão)

# Atualizar sistema
sudo apt update
sudo apt upgrade -y

# Instalar PostgreSQL 16
sudo apt install postgresql postgresql-contrib -y

# Instalar TimescaleDB (opcional, para séries temporais)
sudo sh -c "echo 'deb https://packagecloud.io/timescale/timescaledb/debian/ $(lsb_release -c -s) main' > /etc/apt/sources.list.d/timescaledb.list"
wget --quiet -O - https://packagecloud.io/timescale/timescaledb/gpgkey | sudo apt-key add -
sudo apt update
sudo apt install timescaledb-2-postgresql-16 -y
sudo timescaledb-tune --quiet --yes
```

### 1.2 Criar Banco de Dados

```bash
# Entrar como usuario postgres
sudo -u postgres psql

# Dentro do PostgreSQL:
CREATE DATABASE iot_monitoring;
CREATE USER iot_user WITH PASSWORD 'iot_pass123';
GRANT ALL PRIVILEGES ON DATABASE iot_monitoring TO iot_user;

# Sair
\q
```

### 1.3 Configurar Acesso Remoto

```bash
# Editar postgresql.conf
sudo nano /etc/postgresql/16/main/postgresql.conf

# Encontrar e modificar:
# listen_addresses = 'localhost'
# Para:
# listen_addresses = '*'

# Salvar (Ctrl+O, Enter, Ctrl+X)
```

```bash
# Editar pg_hba.conf
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Adicionar NO FIM:
# host  iot_monitoring  iot_user  0.0.0.0/0  md5
# host  iot_monitoring  iot_user  ::/0       md5
```

### 1.4 Reiniciar PostgreSQL

```bash
sudo systemctl restart postgresql

# Verificar status
sudo systemctl status postgresql

# Testar conexão local
psql -U iot_user -d iot_monitoring -c "SELECT version();"
```

### 1.5 Criar Schema (Tabelas)

```bash
# Conectar ao banco
psql -U iot_user -d iot_monitoring

# Criar tabelas (dentro do psql):
```

```sql
-- Tabela de devices
CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    ip_address INET,
    status VARCHAR(20) DEFAULT 'online',
    last_seen TIMESTAMP DEFAULT NOW(),
    firmware_version VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de telemetria
CREATE TABLE telemetry (
    time TIMESTAMP DEFAULT NOW(),
    device_id INTEGER NOT NULL REFERENCES devices(id),
    temperature_c FLOAT,
    humidity_percent FLOAT,
    pressure_hpa FLOAT,
    rssi_dbm INTEGER,
    battery_voltage FLOAT,
    PRIMARY KEY (time, device_id)
);

-- Tabela de alertas
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id),
    alert_type VARCHAR(50),
    severity VARCHAR(20),
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_telemetry_device_time ON telemetry(device_id, time DESC);
CREATE INDEX idx_telemetry_time ON telemetry(time DESC);
CREATE INDEX idx_devices_status ON devices(status);
```

```bash
# Sair
\q
```

### 1.6 Testar Acesso Remoto (do Notebook)

```bash
# No seu Notebook/PC, testar:
psql -h 100.82.140.119 -U iot_user -d iot_monitoring -c "SELECT version();"

# Deve responder com versão do PostgreSQL
```

---

## 📋 PARTE 2: NOTEBOOK - Backend + Gateway + MQTT

### 2.1 Pré-requisitos

```bash
# Verificar Docker
docker --version
docker-compose --version

# Se não tiver, instalar Docker Desktop
# https://docker.com/products/docker-desktop
```

### 2.2 Preparar Arquivos

Na pasta do projeto (`Trabalho Final`):

```bash
# Criar .env com dados do Raspberry
cat > .env << 'EOF'
POSTGRES_HOST=100.82.140.119
POSTGRES_PORT=5432
POSTGRES_DB=iot_monitoring
POSTGRES_USER=iot_user
POSTGRES_PASSWORD=iot_pass123

BACKEND_PORT=3000
GATEWAY_PORT=3001
MQTT_PORT=1883
INGEST_HTTP_PORT=3102

LOGIN_USER=admin
LOGIN_PASSWORD=123456

DB_RETENTION_DAYS=30
SIMULATION_INTERVAL_MS=5000
NODE_ENV=production
EOF
```

### 2.3 Build da Imagem Docker (Primeira Vez)

```bash
# Entrar na pasta do projeto
cd "C:\Users\Leonardo\OneDrive\Documentos\VS Code\Sistemas Distribuidos\Trabalho Final"

# Build da imagem
docker-compose -f docker-compose-remote.yml build

# Esperar ~5-10 minutos
```

### 2.4 Subir os Serviços

```bash
# Iniciar todos os containers
docker-compose -f docker-compose-remote.yml up -d

# Verificar status
docker-compose -f docker-compose-remote.yml ps
```

### 2.5 Verificar Conexões

```bash
# Backend conectou ao BD Raspberry?
docker-compose -f docker-compose-remote.yml logs backend | grep -i "database\|connected"

# Testar endpoint
curl http://localhost:3000/health

# Esperado:
# {"ok": true, "backend": "online", "database": "connected"}
```

---

## 🔄 FLUXO COMPLETO (Setup Inicial)

### RASPBERRY (Uma vez)

```bash
# 1. SSH
ssh pi@100.82.140.119

# 2. Instalar PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# 3. Criar DB
sudo -u postgres psql
CREATE DATABASE iot_monitoring;
CREATE USER iot_user WITH PASSWORD 'iot_pass123';
GRANT ALL PRIVILEGES ON DATABASE iot_monitoring TO iot_user;
\q

# 4. Configurar acesso remoto
sudo nano /etc/postgresql/16/main/postgresql.conf
# listen_addresses = '*'

sudo nano /etc/postgresql/16/main/pg_hba.conf
# Adicionar: host  iot_monitoring  iot_user  0.0.0.0/0  md5

# 5. Reiniciar
sudo systemctl restart postgresql

# 6. Criar tabelas (em outro terminal)
psql -U iot_user -d iot_monitoring
# (copiar SQL do item 1.5 acima)
\q
```

### NOTEBOOK (Uma vez + sempre que subir)

```bash
# 1. Entrar na pasta
cd "C:\Users\Leonardo\OneDrive\Documentos\VS Code\Sistemas Distribuidos\Trabalho Final"

# 2. Criar .env (primeira vez)
@"
POSTGRES_HOST=100.82.140.119
POSTGRES_PORT=5432
...
"@ | Set-Content -Path ".env"

# 3. Build (primeira vez - ~5 min)
docker-compose -f docker-compose-remote.yml build

# 4. Start
docker-compose -f docker-compose-remote.yml up -d

# 5. Verificar
docker-compose -f docker-compose-remote.yml ps

# 6. Acessar
# http://localhost:3000
# Login: admin / 123456
```

---

## 📊 Comandos de Gerenciamento

### RASPBERRY

```bash
# Ver status do PostgreSQL
sudo systemctl status postgresql

# Ver logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log

# Conectar ao banco
psql -U iot_user -d iot_monitoring

# Dentro do psql:
SELECT * FROM devices;
SELECT COUNT(*) FROM telemetry;
```

### NOTEBOOK

```bash
# Ver status dos containers
docker-compose -f docker-compose-remote.yml ps

# Ver logs
docker-compose -f docker-compose-remote.yml logs -f

# Parar
docker-compose -f docker-compose-remote.yml down

# Restart
docker-compose -f docker-compose-remote.yml restart backend

# Testar endpoints
curl http://localhost:3000/health
curl http://localhost:3001/health
```

---

## 🧪 Teste Completo

### 1. Verificar PostgreSQL no Raspberry

```bash
# Do seu PC/Notebook:
psql -h 100.82.140.119 -U iot_user -d iot_monitoring -c "SELECT * FROM devices;"

# Deve retornar: (0 rows) - vazio no início
```

### 2. Inserir Dados de Teste

```bash
# Ainda pelo psql remoto:
INSERT INTO devices (name, location, ip_address) VALUES 
  ('ESP32-Sala', 'Sala', '192.168.1.100'),
  ('ESP32-Quarto', 'Quarto', '192.168.1.101');

INSERT INTO telemetry (device_id, temperature_c, humidity_percent, pressure_hpa, rssi_dbm) 
VALUES 
  (1, 23.5, 55.2, 1013.25, -65),
  (2, 21.0, 48.1, 1013.15, -72);

SELECT * FROM telemetry ORDER BY time DESC LIMIT 5;
```

### 3. Acessar Dashboard

```
http://localhost:3000
```

Você deve ver os dados nas tabelas!

---

## ⚠️ Troubleshooting

### Raspberry não conecta

```bash
# Verificar IP
hostname -I

# Verificar se PostgreSQL está escutando em *
sudo ss -tlnp | grep 5432

# Verificar pg_hba.conf
sudo grep -v "^#" /etc/postgresql/16/main/pg_hba.conf | grep -v "^$"
```

### Notebook não conecta ao BD

```bash
# Ver logs do Backend
docker-compose -f docker-compose-remote.yml logs backend | grep -i error

# Testar conexão manualmente
psql -h 100.82.140.119 -U iot_user -d iot_monitoring -c "SELECT version();"
```

### Porta já em uso

```bash
# Encontrar processo
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Mudar no .env
BACKEND_PORT=3001
```

---

## 📍 Endpoints Finais

| Máquina | Serviço | URL/IP | Função |
|---------|---------|--------|--------|
| **Raspberry** | PostgreSQL | 100.82.140.119:5432 | Banco de dados |
| **Notebook** | Backend | http://localhost:3000 | UI + API |
| **Notebook** | Gateway | http://localhost:3001 | Proxy |
| **Notebook** | MQTT | mqtt://localhost:1883 | Broker |

---

## 🎯 Próximos Passos

1. ✅ Instalar PostgreSQL no Raspberry
2. ✅ Criar database e tabelas
3. ✅ Configurar acesso remoto
4. ✅ Testar conexão do Notebook
5. ✅ Subir Backend no Notebook
6. ✅ Acessar dashboard
7. ✅ Configurar ESP32 para enviar dados

**Você está pronto para produção!** 🚀
