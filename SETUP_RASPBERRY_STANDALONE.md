# Setup 100% Online - Raspberry Pi Standalone 🚀

## Topologia Final

```
┌─────────────────────────────────────┐
│ RASPBERRY PI 3B (100.82.140.119)   │
│ ┌─────────────────────────────────┐ │
│ │ PostgreSQL       :5432          │ │
│ │ Backend          :3000          │ │
│ │ Gateway          :3001          │ │
│ │ MQTT Broker      :1883          │ │
│ │ (Docker + Docker Compose)       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Sempre online, independente do PC   │
└─────────────────────────────────────┘
         ▲
         │ HTTP/MQTT
         │
    ESP32/ESP8266 (WiFi)
    
    Seu PC/Notebook
    (pode estar desligado!)
```

---

## ⚡ INSTALAÇÃO (Raspberry Pi)

### 1️⃣ SSH no Raspberry

```bash
ssh pi@100.82.140.119
# Senha: raspberry
```

### 2️⃣ Instalar Docker e Docker Compose

```bash
# Instalar Docker
curl -sSL https://get.docker.com | sh

# Adicionar permissão para user pi
sudo usermod -aG docker pi

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Sair e conectar de novo
exit
ssh pi@100.82.140.119
```

### 3️⃣ Clonar/Copiar Projeto

```bash
# Opção A: Clonar do Git (se tiver repositório)
cd ~
git clone https://seu-repo.git trabalho-final
cd trabalho-final

# Opção B: Copiar via SCP do seu PC
# No seu PC:
scp -r "C:\...\Trabalho Final" pi@100.82.140.119:~/trabalho-final

# Depois:
ssh pi@100.82.140.119
cd ~/trabalho-final
```

### 4️⃣ Criar .env no Raspberry

```bash
cat > .env << 'EOF'
POSTGRES_HOST=localhost
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

### 5️⃣ Criar docker-compose.yml Completo

Criar arquivo `docker-compose-standalone.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: postgres:16-alpine
    restart: always
    container_name: tf-db
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-iot_monitoring}
      POSTGRES_USER: ${POSTGRES_USER:-iot_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-iot_pass123}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./sql:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - tf-network

  # MQTT Broker
  mqtt:
    image: eclipse-mosquitto:2-alpine
    restart: always
    container_name: tf-mqtt
    ports:
      - "${MQTT_PORT:-1883}:1883"
    volumes:
      - ./docker/mosquitto.conf:/mosquitto/config/mosquitto.conf:ro
      - mqtt-data:/mosquitto/data
      - mqtt-logs:/mosquitto/log
    healthcheck:
      test: ["CMD", "mosquitto_sub", "-h", "127.0.0.1", "-t", "$SYS/broker/uptime"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - tf-network

  # Backend Node.js
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    container_name: tf-backend
    depends_on:
      db:
        condition: service_healthy
      mqtt:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: ${POSTGRES_DB:-iot_monitoring}
      DB_USER: ${POSTGRES_USER:-iot_user}
      DB_PASSWORD: ${POSTGRES_PASSWORD:-iot_pass123}
      DB_SSL: "false"
      BROKER_URL: tcp://mqtt:1883
      LOGIN_USER: ${LOGIN_USER:-admin}
      LOGIN_PASSWORD: ${LOGIN_PASSWORD:-123456}
      GENERATE_SYSTEM_CONFIG: "1"
    ports:
      - "${BACKEND_PORT:-3000}:3000"
    volumes:
      - ./data:/app/data
      - backend-logs:/app/logs
    networks:
      - tf-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  # API Gateway
  gateway:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    container_name: tf-gateway
    depends_on:
      backend:
        condition: service_healthy
    environment:
      NODE_ENV: production
      BACKEND_URL: http://backend:3000
      PORT: 3001
    ports:
      - "${GATEWAY_PORT:-3001}:3001"
    volumes:
      - gateway-logs:/app/logs
    networks:
      - tf-network
    command: node api-server.js
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Ingest Service
  ingest:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    container_name: tf-ingest
    depends_on:
      db:
        condition: service_healthy
      mqtt:
        condition: service_healthy
    environment:
      NODE_ENV: production
      INGEST_HTTP_PORT: 3102
      BROKER_URL: tcp://mqtt:1883
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: ${POSTGRES_DB:-iot_monitoring}
      DB_USER: ${POSTGRES_USER:-iot_user}
      DB_PASSWORD: ${POSTGRES_PASSWORD:-iot_pass123}
      DB_SSL: "false"
    ports:
      - "${INGEST_HTTP_PORT:-3102}:3102"
    volumes:
      - ingest-logs:/app/logs
    networks:
      - tf-network
    command: node ingest-service.js
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3102/health"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
    driver: local
  mqtt-data:
    driver: local
  mqtt-logs:
    driver: local
  backend-logs:
    driver: local
  gateway-logs:
    driver: local
  ingest-logs:
    driver: local

networks:
  tf-network:
    driver: bridge
```

### 6️⃣ Build e Start (Primeira Vez)

```bash
# Build das imagens (pode levar 10-15 min)
docker-compose -f docker-compose-standalone.yml build

# Start dos serviços
docker-compose -f docker-compose-standalone.yml up -d

# Verificar status
docker-compose -f docker-compose-standalone.yml ps

# Verificar logs
docker-compose -f docker-compose-standalone.yml logs -f
```

### 7️⃣ Configurar Auto-start

```bash
# Habilitar docker para iniciar na boot
sudo systemctl enable docker

# Criar script para auto-iniciar compose
cat > ~/start-tf.sh << 'EOF'
#!/bin/bash
cd ~/trabalho-final
docker-compose -f docker-compose-standalone.yml up -d
EOF

chmod +x ~/start-tf.sh

# Adicionar ao crontab para iniciar após reboot
(crontab -l 2>/dev/null; echo "@reboot sleep 10 && /home/pi/start-tf.sh") | crontab -
```

---

## 📍 Acessar de Qualquer Lugar

### Do Seu PC/Notebook

```bash
# Dashboard
http://100.82.140.119:3000

# API
http://100.82.140.119:3001/api/...

# MQTT
mqtt://100.82.140.119:1883

# PostgreSQL
psql -h 100.82.140.119 -U iot_user -d iot_monitoring
```

### Do ESP32

```cpp
const char* serverURL = "http://100.82.140.119:3000/api/telemetry";
const char* gatewayURL = "http://100.82.140.119:3001/api/telemetry";
```

---

## 🔄 Gerenciamento Diário

### Ver Status

```bash
ssh pi@100.82.140.119
docker-compose -f ~/trabalho-final/docker-compose-standalone.yml ps
```

### Ver Logs

```bash
docker-compose -f ~/trabalho-final/docker-compose-standalone.yml logs -f backend
```

### Parar Tudo

```bash
docker-compose -f ~/trabalho-final/docker-compose-standalone.yml down
```

### Reiniciar

```bash
docker-compose -f ~/trabalho-final/docker-compose-standalone.yml restart
```

### Parar e Remover Dados

```bash
docker-compose -f ~/trabalho-final/docker-compose-standalone.yml down -v
```

---

## ✅ Checklist

- [ ] Docker instalado no Raspberry
- [ ] Docker Compose instalado
- [ ] Projeto copiado para `~/trabalho-final`
- [ ] `.env` criado com `POSTGRES_HOST=localhost`
- [ ] `docker-compose-standalone.yml` criado
- [ ] Build concluído: `docker-compose -f docker-compose-standalone.yml build`
- [ ] Serviços rodando: `docker-compose -f docker-compose-standalone.yml ps`
- [ ] Dashboard acessível: `http://100.82.140.119:3000`
- [ ] Auto-start configurado

---

## 📊 Ports Abertos no Raspberry

| Porta | Serviço |
|-------|---------|
| 3000 | Backend |
| 3001 | Gateway |
| 1883 | MQTT |
| 3102 | Ingest |
| 5432 | PostgreSQL |

---

## 🧪 Teste

```bash
# Do seu PC/Notebook
curl http://100.82.140.119:3000/health

# Esperado:
# {"ok": true, "backend": "online", "database": "connected"}
```

---

## 🎯 Resultado Final

✅ **Raspberry sempre online, 24/7**
✅ **Nenhuma necessidade do notebook**
✅ **Acesso de qualquer lugar da rede**
✅ **ESP32 envia dados diretamente pro Raspberry**
✅ **Dashboard acessível mesmo com PC desligado**

**Sistema Distribuído Completo e Autossuficiente!** 🚀
