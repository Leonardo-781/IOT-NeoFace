# Setup Distribuído com Docker

## Arquitetura

```
┌─────────────────────────────────────┐
│ Raspberry Pi 3                      │
│ ┌───────────────────────────────┐   │
│ │ PostgreSQL/TimescaleDB        │   │
│ │ :5432 (iot_monitoring)        │   │
│ └───────────────────────────────┘   │
└─────────────┬───────────────────────┘
              │ TCP 5432
              │ (Ethernet/WiFi)
              ▼
┌─────────────────────────────────────────┐
│ Notebook/PC (Docker Desktop)            │
│ ┌──────────────────────────────────┐    │
│ │ Backend        :3000             │    │
│ │ API Gateway    :3001             │    │
│ │ Broker MQTT    :1883             │    │
│ │ Ingest Service :3102             │    │
│ └──────────────────────────────────┘    │
└─────────────────────────────────────────┘
              ▲
              │
        HTTP/WebSocket
              │
    ESP32 / ESP8266 (WiFi)
```

---

## Pré-requisitos

### 1️⃣ Docker Desktop
- **Windows/Mac**: [docker.com/products/docker-desktop](https://docker.com)
- **Linux**: `sudo apt-get install docker.io docker-compose`

Verificar:
```bash
docker --version
docker-compose --version
```

### 2️⃣ PostgreSQL no Raspberry Pi
Já está rodando em `100.82.140.119:5432`

---

## Configuração

### Opção A: Rodar APENAS Backend (BD remoto no Rasp)

**Criar arquivo `.env`:**
```bash
# .env
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
```

**Criar `docker-compose-remote.yml`:**
```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
    restart: unless-stopped
    environment:
      GENERATE_SYSTEM_CONFIG: "1"
      DB_HOST: ${POSTGRES_HOST}
      DB_PORT: ${POSTGRES_PORT}
      DB_NAME: ${POSTGRES_DB}
      DB_USER: ${POSTGRES_USER}
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_SSL: "false"
      LOGIN_USER: ${LOGIN_USER}
      LOGIN_PASSWORD: ${LOGIN_PASSWORD}
      PORT: ${BACKEND_PORT}
      MQTT_HOST: mqtt
      BROKER_URL: tcp://mqtt:1883
    ports:
      - "${BACKEND_PORT}:3000"
    depends_on:
      - mqtt

  mqtt:
    image: eclipse-mosquitto:2
    restart: unless-stopped
    ports:
      - "${MQTT_PORT}:1883"
    volumes:
      - ./docker/mosquitto.conf:/mosquitto/config/mosquitto.conf:ro
      - mqtt-data:/mosquitto/data
    healthcheck:
      test: ["CMD", "mosquitto_sub", "-t", "$SYS/broker/uptime"]
      interval: 10s
      timeout: 5s
      retries: 3

  gateway:
    build:
      context: .
    restart: unless-stopped
    environment:
      BACKEND_URL: http://backend:3000
      PORT: ${GATEWAY_PORT}
    ports:
      - "${GATEWAY_PORT}:3001"
    depends_on:
      - backend

volumes:
  mqtt-data:
```

### Opção B: Rodar TUDO (BD local no Docker)

**Usa o `docker-compose.yml` padrão:**
```yaml
docker-compose up -d
```

---

## Como Executar

### Opção A: Backend com BD Remoto (RECOMENDADO)

```bash
# 1. Na pasta do projeto
cd /path/to/Trabalho\ Final

# 2. Criar .env
cat > .env << EOF
POSTGRES_HOST=100.82.140.119
POSTGRES_PORT=5432
POSTGRES_DB=iot_monitoring
POSTGRES_USER=iot_user
POSTGRES_PASSWORD=iot_pass123
BACKEND_PORT=3000
GATEWAY_PORT=3001
MQTT_PORT=1883
LOGIN_USER=admin
LOGIN_PASSWORD=123456
EOF

# 3. Subir com BD remoto
docker-compose -f docker-compose-remote.yml up -d

# 4. Ver logs
docker-compose -f docker-compose-remote.yml logs -f backend
```

### Opção B: Tudo Local (com BD no Docker)

```bash
# 1. Subir todos os serviços
docker-compose up -d

# 2. Criar tabelas (primeira vez)
docker-compose exec backend npm run migrate

# 3. Ver status
docker-compose ps

# 4. Acessar
open http://localhost:3000
```

---

## Verificação

### Check Backend
```bash
curl http://localhost:3000/health
```

**Resposta esperada:**
```json
{
  "ok": true,
  "backend": "online",
  "database": "connected",
  "ts": "2026-05-12T10:30:00Z"
}
```

### Check Gateway
```bash
curl http://localhost:3001/health
```

### Check Conexão BD
```bash
docker-compose -f docker-compose-remote.yml logs backend | grep -i "database\|connected"
```

---

## Gerenciar

```bash
# Ver status
docker-compose -f docker-compose-remote.yml ps

# Ver logs
docker-compose -f docker-compose-remote.yml logs -f backend

# Parar
docker-compose -f docker-compose-remote.yml down

# Remover volumes
docker-compose -f docker-compose-remote.yml down -v

# Rebuild
docker-compose -f docker-compose-remote.yml build --no-cache

# Restart um serviço
docker-compose -f docker-compose-remote.yml restart backend
```

---

## Acesso

| Serviço | URL | Função |
|---------|-----|--------|
| **UI** | http://localhost:3000 | Dashboard |
| **API Gateway** | http://localhost:3001/api/* | Proxy para Backend |
| **MQTT** | mqtt://localhost:1883 | Broker de mensagens |

**Login padrão:**
```
usuário: admin
senha: 123456
```

---

## Solução de Problemas

### BD não conecta
```bash
# Verificar se Raspberry está acessível
ping 100.82.140.119

# Testar conexão psql
psql -h 100.82.140.119 -U iot_user -d iot_monitoring -c "SELECT version();"
```

### Porta já em uso
```bash
# Mudar no .env
BACKEND_PORT=3001  # em vez de 3000
```

### Docker não encontra build
```bash
docker-compose build --no-cache
```

---

## Fluxo ESP32 → Backend

```
ESP32 POST /api/telemetry
    ↓
Nginx/Gateway (porta 80) - opcional
    ↓
Backend (porta 3000)
    ↓
PostgreSQL (Raspberry 100.82.140.119:5432)
```

Para ESP32 enviar para Docker local:
```cpp
const char* serverURL = "http://192.168.1.11:3000/api/telemetry";
// ou
const char* serverURL = "http://192.168.1.11:3001/api/telemetry"; // via gateway
```

---

## Próximos Passos

1. ✅ Subir Backend com `docker-compose-remote.yml`
2. ✅ Testar `/health` endpoint
3. ✅ Configurar ESP32 para enviar dados
4. ✅ Ver telemetria chegando no dashboard
