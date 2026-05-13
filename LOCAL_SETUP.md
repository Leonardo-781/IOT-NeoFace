# 🚀 SETUP LOCAL - Notebook 100%

Seu sistema IoT rodando **completamente** no seu notebook com Docker Compose.

---

## 📋 Pré-requisitos

- ✅ Docker Desktop instalado (Windows/Mac) ou Docker Engine (Linux)
- ✅ Docker Compose v2+
- ✅ ~2GB RAM disponível
- ✅ Portas livres: 3000, 3001, 1883, 5432

---

## 🎯 1. Preparar o Notebook

### Verificar Docker
```bash
docker --version
docker-compose --version
```

### Clonar/Ir para projeto
```bash
cd "C:\Users\Leonardo\OneDrive\Documentos\VS Code\Sistemas Distribuidos\Trabalho Final"
```

---

## 🐳 2. Iniciar Sistema (Docker Compose)

### Build (primeira vez apenas)
```bash
docker-compose build
```

### Start
```bash
docker-compose up -d
```

### Verificar
```bash
docker-compose ps

# Deve mostrar 4 containers "Up":
# - db (PostgreSQL)
# - mqtt (Mosquitto)
# - backend (Node.js :3000)
# - gateway (Node.js :3001)
# - ingest (Serviço de ingestão)
```

### Ver logs
```bash
docker-compose logs -f

# Ou específico:
docker-compose logs -f backend
```

---

## 🌐 3. Acessar o Sistema

### Dashboard web
```
http://localhost:3000
```

### Login padrão
```
Usuário: admin
Senha: 123456
```

### API Gateway
```
http://localhost:3001
```

### Health check
```bash
curl http://localhost:3000/health
curl http://localhost:3001/health
```

---

## 📊 4. Banco de Dados

### Conectar localmente
```bash
# Usar pgAdmin (opcional - já está em alguns dockers)
# OU via CLI:
# Install: choco install postgresql (Windows)

psql -h localhost -U iot_user -d iot_monitoring
```

### Senha
```
iot_pass123
```

### Ver tabelas
```sql
\dt
SELECT * FROM devices;
SELECT * FROM telemetry LIMIT 5;
```

---

## 🔌 5. ESP32 / IoT

### Configurar esp32_gateway.ino

Edite [esp32/esp32_gateway.ino](esp32/esp32_gateway.ino):

```cpp
#define WIFI_SSID "SEU_WIFI"
#define WIFI_PASSWORD "SUA_SENHA"
#define API_URL "http://localhost:3001/api/ingest"  // ← SEU IP local
#define GATEWAY_ID "GW01"
```

**Importante:** Se ESP32 está em outra máquina, usar IP do notebook:
```cpp
#define API_URL "http://192.168.X.X:3001/api/ingest"  // IP do notebook na rede WiFi
```

### Upload
- Arduino IDE → Selecionar ESP32-DEVKIT-V1
- Compile + Upload

---

## ⏹️ 6. Parar Sistema

```bash
docker-compose down

# Remover dados (CUIDADO - perde tudo):
docker-compose down -v
```

---

## 🆘 Troubleshooting

### Porta já em uso
```bash
# Mudar porta no .env
BACKEND_PORT=3000
# ↓
BACKEND_PORT=3000  # Alterar para 3010, 3020, etc

# Depois:
docker-compose down
docker-compose up -d
```

### Containers não sobem
```bash
docker-compose logs backend
docker-compose logs db
```

### Database lento
```bash
# Aumentar recursos Docker:
# Docker Desktop → Preferences → Resources → Memory: 4GB+
```

### Não consegue conectar PostgreSQL
```bash
# Verificar se container db está rodando:
docker ps | grep db

# Logs:
docker-compose logs db
```

---

## 📈 Performance

Em notebook com i5 + 8GB RAM:
- ✅ Dashboard responsivo
- ✅ Até 10 sensores simultâneos
- ✅ Latência < 500ms

---

## ✅ Checklist Rápido

- [ ] Docker Compose rodando
- [ ] 4 containers em "Up"
- [ ] http://localhost:3000 acessível
- [ ] Login com admin/123456 funciona
- [ ] Dados aparecem no dashboard
- [ ] ESP32 conectado e enviando dados

---

## 🎉 Pronto!

Sistema distribuído rodando 100% no seu notebook. Estude, teste, divirta-se!

**Próximo passo:** Conectar ESP32 com dados reais e testar integração end-to-end.
