# 🎯 RESUMO FINAL - Dois Servidores

## 📊 Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│ RASPBERRY PI 3B (100.82.140.119)                           │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ PostgreSQL 16                                        │    │
│ │ • Database: iot_monitoring                           │    │
│ │ • User: iot_user / iot_pass123                       │    │
│ │ • Porta: 5432                                        │    │
│ │ • Tabelas: devices, telemetry, alerts               │    │
│ └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                        ▲
                        │ TCP 5432
                        │ (Ethernet/WiFi)
                        │
┌─────────────────────────────────────────────────────────────┐
│ NOTEBOOK (Seu PC)                                          │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ Backend (Node.js) :3000                              │    │
│ │ • Dashboard web                                      │    │
│ │ • API REST                                           │    │
│ ├──────────────────────────────────────────────────────┤    │
│ │ Gateway (Node.js) :3001                              │    │
│ │ • Proxy / Load Balancer                              │    │
│ ├──────────────────────────────────────────────────────┤    │
│ │ MQTT Broker :1883                                    │    │
│ │ • Mensagens entre serviços                           │    │
│ │ • (Docker + Docker Compose)                          │    │
│ └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                        ▲
                        │ HTTP/MQTT
                        │
                  ESP32/ESP8266 (WiFi)
```

---

## 🚀 PASSO 1: RASPBERRY PI

### 1️⃣ Executar Setup Automático

```bash
# Do seu PC/Notebook, execute:
ssh pi@100.82.140.119 'bash -s' < setup-raspberry.sh

# Senha: raspberry (padrão)
```

### 2️⃣ Aguardar Conclusão (~5 min)

```
✓ Sistema atualizado
✓ PostgreSQL instalado
✓ Database iot_monitoring criado
✓ Usuário iot_user criado
✓ Acesso remoto configurado
✓ Tabelas criadas
```

### 3️⃣ Anotarr IP do Raspberry

```bash
ssh pi@100.82.140.119 'hostname -I'
# Resultado: 100.82.140.119 (ou o IP que aparecer)
```

---

## 🚀 PASSO 2: NOTEBOOK

### 1️⃣ Abrir PowerShell/Terminal

```bash
cd "C:\Users\Leonardo\OneDrive\Documentos\VS Code\Sistemas Distribuidos\Trabalho Final"
```

### 2️⃣ Criar .env

```powershell
@"
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
NODE_ENV=production
"@ | Set-Content -Path ".env"
```

### 3️⃣ Build (Primeira Vez)

```bash
docker-compose -f docker-compose-remote.yml build
# Esperar ~5-10 minutos
```

### 4️⃣ Start

```bash
docker-compose -f docker-compose-remote.yml up -d
```

### 5️⃣ Verificar

```bash
docker-compose -f docker-compose-remote.yml ps

# Deve mostrar 4 containers "Up":
# tf-backend    Up
# tf-gateway    Up
# tf-mqtt       Up
# tf-ingest     Up
```

### 6️⃣ Testar

```bash
curl http://localhost:3000/health

# Esperado:
# {"ok": true, "backend": "online", "database": "connected", "ts": "..."}
```

### 7️⃣ Acessar

```
http://localhost:3000

Usuário: admin
Senha: 123456
```

---

## 📊 Checklist

### RASPBERRY
- [ ] SSH conecta: `ssh pi@100.82.140.119`
- [ ] Script executou sem erros: `ssh pi@100.82.140.119 'bash -s' < setup-raspberry.sh`
- [ ] PostgreSQL rodando: `sudo systemctl status postgresql`
- [ ] Acessível remotamente: `psql -h 100.82.140.119 -U iot_user -d iot_monitoring -c "SELECT 1;"`

### NOTEBOOK
- [ ] Docker instalado: `docker --version`
- [ ] .env criado com IP correto do Raspberry
- [ ] Build concluído: `docker-compose -f docker-compose-remote.yml build`
- [ ] Containers rodando: `docker-compose -f docker-compose-remote.yml ps`
- [ ] Backend responde: `curl http://localhost:3000/health`
- [ ] Dashboard acessível: `http://localhost:3000`

---

## 🔄 Gerenciamento Diário

### Ligar Tudo

```bash
# NOTEBOOK (Backend já ativa automaticamente se Raspberry estiver online)
cd "C:\Users\Leonardo\OneDrive\Documentos\VS Code\Sistemas Distribuidos\Trabalho Final"
docker-compose -f docker-compose-remote.yml up -d

# Abrir
http://localhost:3000
```

### Ver Logs

```bash
# Todos
docker-compose -f docker-compose-remote.yml logs -f

# Apenas Backend
docker-compose -f docker-compose-remote.yml logs -f backend

# Apenas MQTT
docker-compose -f docker-compose-remote.yml logs -f mqtt
```

### Parar Tudo

```bash
docker-compose -f docker-compose-remote.yml down
```

### Reiniciar Backend

```bash
docker-compose -f docker-compose-remote.yml restart backend
```

---

## 📍 Endpoints

| Serviço | URL | Funcionalidade |
|---------|-----|---|
| **Dashboard** | http://localhost:3000 | Interface web |
| **API** | http://localhost:3000/api/* | Endpoints REST |
| **Gateway** | http://localhost:3001 | Proxy |
| **MQTT** | mqtt://localhost:1883 | Broker de mensagens |
| **PostgreSQL** | 100.82.140.119:5432 | Banco de dados |

---

## 🧪 Teste E2E

### 1. Testar BD

```bash
psql -h 100.82.140.119 -U iot_user -d iot_monitoring -c "SELECT version();"
```

### 2. Inserir Device Teste

```bash
psql -h 100.82.140.119 -U iot_user -d iot_monitoring << SQL
INSERT INTO devices (name, location, ip_address) VALUES ('ESP32-Test', 'Sala', '192.168.1.100');
SQL
```

### 3. Verificar no Dashboard

```
http://localhost:3000
```

Você deve ver o device listado!

---

## ⚠️ Troubleshooting

### Raspberry não responde

```bash
# Verificar IP
ping 100.82.140.119

# Verificar SSH
ssh pi@100.82.140.119 'echo OK'

# Ver status do PostgreSQL
ssh pi@100.82.140.119 'sudo systemctl status postgresql'
```

### Backend não conecta ao BD

```bash
# Ver erro
docker-compose -f docker-compose-remote.yml logs backend | grep -i error

# Testar conexão
psql -h 100.82.140.119 -U iot_user -d iot_monitoring -c "SELECT 1;"
```

### Container travado

```bash
# Ver logs
docker-compose -f docker-compose-remote.yml logs

# Reiniciar
docker-compose -f docker-compose-remote.yml restart

# Rebuild
docker-compose -f docker-compose-remote.yml down -v
docker-compose -f docker-compose-remote.yml build --no-cache
docker-compose -f docker-compose-remote.yml up -d
```

---

## 📚 Documentação

- [SETUP_DISTRIBUIDO.md](SETUP_DISTRIBUIDO.md) - Guia completo e detalhado
- [COMANDOS_DOCKER.md](COMANDOS_DOCKER.md) - Referência de comandos
- [DOCKER_SETUP.md](DOCKER_SETUP.md) - Setup com Docker
- [README.md](README.md) - Documentação do projeto

---

**🎉 Sistema Pronto para Produção!**

Seus ESP32 podem começar a enviar dados para `http://[IP_NOTEBOOK]:3000/api/telemetry`
