# 🚀 SETUP HÍBRIDO: Metade Raspberry + Metade Notebook

## 🎯 Arquitetura

```
┌──────────────────────────────────────┐
│    RASPBERRY PI (192.168.1.10)       │
│                                      │
│  📦 PostgreSQL :5432                 │
│  📦 MQTT Broker :1883                │
│                                      │
│  (Sempre online)                     │
└──────────────────────────────────────┘
              ↑
              │ TCP
              │
┌──────────────────────────────────────┐
│    NOTEBOOK (192.168.1.11)           │
│                                      │
│  📦 Backend :3000 + Website 🌐       │
│  📦 API Gateway :3001                │
│  📦 Ingest Service :3102             │
│                                      │
│  (Precisa estar SEMPRE LIGADO)       │
└──────────────────────────────────────┘
              ↑
              │ HTTP POST
              │
         ┌────────┐
         │ ESP32  │ (WiFi)
         └────────┘
```

---

## 📋 PRÉ-REQUISITOS

### Raspberry Pi
- ✅ IP estático: `192.168.1.10`
- ✅ Docker instalado
- ✅ Docker Compose instalado

### Notebook
- ✅ IP estático: `192.168.1.11` (ou qual for seu IP)
- ✅ Docker instalado
- ✅ Docker Compose instalado
- ✅ Deve estar SEMPRE ligado (24/7)

### Rede
- ✅ Ambos na mesma rede WiFi/Ethernet
- ✅ Conectividade entre eles (ping 192.168.1.10 deve funcionar)

---

## 🚀 PASSO 1: SETUP NO RASPBERRY PI

### 1.1 SSH para Raspberry
```bash
ssh pi@192.168.1.10
```

### 1.2 Copiar projeto
```bash
git clone <seu-repo> ~/trabalho-final
# OU
scp -r ~/trabalho-final pi@192.168.1.10:~/
cd ~/trabalho-final
```

### 1.3 Verificar IP
```bash
hostname -I
# Deve retornar: 192.168.1.10 (ou seu IP)
```

### 1.4 Iniciar apenas Database + MQTT
```bash
# Build
docker-compose -f docker-compose.rasp.yml build

# Start
docker-compose -f docker-compose.rasp.yml up -d

# Verificar
docker-compose -f docker-compose.rasp.yml ps
```

**Esperado:**
```
CONTAINER ID   IMAGE              STATUS
xxxxx          postgres:16        Up 2 min
xxxxx          mosquitto:2        Up 2 min
```

### 1.5 Testar conexão
```bash
# PostgreSQL
psql -h 192.168.1.10 -U iot_user -d iot_monitoring -c "SELECT VERSION();"

# MQTT
mosquitto_sub -h 192.168.1.10 -t test
```

---

## 🚀 PASSO 2: SETUP NO NOTEBOOK

### 2.1 Copiar projeto
```bash
cd ~/trabalho-final
git pull  # ou copie os arquivos
```

### 2.2 Atualizar IPs no .env
```bash
# Verificar IP do notebook
hostname -I
# Ex: 192.168.1.11

# Verificar IP do Raspberry já configurado
# Deve estar em: docker-compose.notebook.yml
# Variáveis: DB_HOST=192.168.1.10, MQTT_HOST=192.168.1.10
```

### 2.3 (OPCIONAL) Editar .env se necessário
```bash
nano .env
```

Verifique se tem:
```env
# Apontam para Raspberry
DB_HOST=192.168.1.10
MQTT_HOST=192.168.1.10

# Backend local
BACKEND_PORT=3000
GATEWAY_PORT=3001
INGEST_HTTP_PORT=3102
```

### 2.4 Iniciar Backend + Gateway + Ingest
```bash
# Build (primeira vez)
docker-compose -f docker-compose.notebook.yml build

# Start
docker-compose -f docker-compose.notebook.yml up -d

# Verificar
docker-compose -f docker-compose.notebook.yml ps
```

**Esperado:**
```
CONTAINER ID   IMAGE    STATUS
xxxxx          backend  Up 1 min
xxxxx          gateway  Up 1 min
xxxxx          ingest   Up 1 min
```

### 2.5 Testar conexão local
```bash
# Backend
curl http://localhost:3000/health

# API Gateway
curl http://localhost:3001/health

# Ingest
curl http://localhost:3102/health
```

### 2.6 Acessar Website
```bash
# No navegador
http://localhost:3000

# Ou do outro PC
http://192.168.1.11:3000

# Login: admin / 123456
```

---

## 🔗 TESTANDO INTEGRAÇÃO

### Verificar se Notebook conecta ao Raspberry
```bash
# Do Notebook

# Test PostgreSQL
docker exec trabalho-final-backend psql -h 192.168.1.10 -U iot_user -d iot_monitoring -c "SELECT COUNT(*) FROM telemetry;"

# Test MQTT
docker exec trabalho-final-ingest mosquitto_sub -h 192.168.1.10 -t home/+/+ -n 1
```

### Verificar logs
```bash
# Backend logs
docker-compose -f docker-compose.notebook.yml logs -f backend

# Ingest logs
docker-compose -f docker-compose.notebook.yml logs -f ingest

# Gateway logs
docker-compose -f docker-compose.notebook.yml logs -f api-gateway
```

---

## 📱 CONFIGURAR ESP32

### Setup no ESP32 (Arduino IDE)

```cpp
#define WIFI_SSID "seu-wifi"
#define WIFI_PASSWORD "sua-senha"

// Aponta para NOTEBOOK (não Raspberry!)
#define API_SERVER "192.168.1.11"
#define API_PORT 3001
#define API_PATH "/api/telemetry"

// MQTT (pode usar Raspberry)
#define MQTT_SERVER "192.168.1.10"
#define MQTT_PORT 1883
#define MQTT_TOPIC "home/sala/sensor1"

void setup() {
  // Conecta WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  
  // Conecta API
  HTTPClient http;
  http.begin("http://" + String(API_SERVER) + ":" + String(API_PORT) + API_PATH);
  http.addHeader("Content-Type", "application/json");
  
  // Envia dados
  String payload = "{\"temperature\": 25.5, \"humidity\": 60}";
  http.POST(payload);
  http.end();
  
  // Conecta MQTT (opcional)
  mqtt.setServer(MQTT_SERVER, MQTT_PORT);
  mqtt.connect("esp32-sensor");
}
```

---

## ⚙️ COMANDOS ÚTEIS

### Parar tudo
```bash
# Raspberry
docker-compose -f docker-compose.rasp.yml down

# Notebook
docker-compose -f docker-compose.notebook.yml down
```

### Reiniciar tudo
```bash
# Raspberry
docker-compose -f docker-compose.rasp.yml restart

# Notebook
docker-compose -f docker-compose.notebook.yml restart
```

### Ver logs em tempo real
```bash
# Raspberry
docker-compose -f docker-compose.rasp.yml logs -f

# Notebook
docker-compose -f docker-compose.notebook.yml logs -f
```

### Limpar tudo (CUIDADO: apaga dados!)
```bash
# Raspberry (remove volumes)
docker-compose -f docker-compose.rasp.yml down -v

# Notebook
docker-compose -f docker-compose.notebook.yml down -v
```

---

## 🆘 TROUBLESHOOTING

### "Connection refused" ao banco
**Problema:** Notebook não consegue conectar ao PostgreSQL no Raspberry  
**Solução:**
```bash
# 1. Verificar se PostgreSQL está rodando no Raspberry
docker-compose -f docker-compose.rasp.yml ps | grep db

# 2. Testar conectividade
ping 192.168.1.10
telnet 192.168.1.10 5432

# 3. Verificar firewall (Raspberry)
sudo ufw allow 5432/tcp
```

### "MQTT connection refused"
**Problema:** Ingest não consegue conectar ao MQTT  
**Solução:**
```bash
# 1. Verificar MQTT no Raspberry
docker-compose -f docker-compose.rasp.yml ps | grep mqtt

# 2. Testar MQTT
mosquitto_sub -h 192.168.1.10 -t test -n 1

# 3. Verificar porta
netstat -tlnp | grep 1883
```

### Notebook não consegue se conectar à Raspberry
**Solução:**
```bash
# 1. Verificar IP do Raspberry
ssh pi@192.168.1.10 hostname -I

# 2. Se IP diferente, editar docker-compose.notebook.yml
nano docker-compose.notebook.yml
# Mudar DB_HOST e MQTT_HOST para IP correto

# 3. Rebuild
docker-compose -f docker-compose.notebook.yml build
docker-compose -f docker-compose.notebook.yml up -d
```

---

## 📊 VERIFICAÇÃO FINAL

✅ Checklist de tudo funcionando:

- [ ] Raspberry: PostgreSQL rodando em 5432
- [ ] Raspberry: MQTT rodando em 1883
- [ ] Notebook: Backend rodando em 3000
- [ ] Notebook: API Gateway rodando em 3001
- [ ] Notebook: Ingest rodando em 3102
- [ ] Website acessível em http://192.168.1.11:3000
- [ ] Login funciona (admin/123456)
- [ ] Dashboard carrega sem erros
- [ ] ESP32 consegue conectar em 192.168.1.11:3001
- [ ] Dados chegam no banco via Ingest

---

## 🔄 CICLO DE DESENVOLVIMENTO

```bash
# Quando modificar código no Notebook:
docker-compose -f docker-compose.notebook.yml down
docker-compose -f docker-compose.notebook.yml build
docker-compose -f docker-compose.notebook.yml up -d

# Quando modificar no Raspberry:
ssh pi@192.168.1.10 "cd ~/trabalho-final && docker-compose -f docker-compose.rasp.yml down && docker-compose -f docker-compose.rasp.yml build && docker-compose -f docker-compose.rasp.yml up -d"
```

---

## 💾 AUTO-START (Opcional)

### Raspberry - Systemd Service
```bash
sudo nano /etc/systemd/system/trabalho-final-rasp.service
```

```ini
[Unit]
Description=Trabalho Final - Raspberry (DB + MQTT)
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/trabalho-final
ExecStart=/usr/bin/docker-compose -f docker-compose.rasp.yml up
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable trabalho-final-rasp.service
sudo systemctl start trabalho-final-rasp.service
```

### Notebook - Systemd Service
```bash
sudo nano /etc/systemd/system/trabalho-final-notebook.service
```

```ini
[Unit]
Description=Trabalho Final - Notebook (Backend)
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/home/$USER/trabalho-final
ExecStart=/usr/bin/docker-compose -f docker-compose.notebook.yml up
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable trabalho-final-notebook.service
sudo systemctl start trabalho-final-notebook.service
```

---

**Pronto! Sistema híbrido implementado!** 🎉
