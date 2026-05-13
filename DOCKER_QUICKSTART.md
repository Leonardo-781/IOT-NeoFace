# Quick Start com Docker 🚀

## Setup Rápido (3 passos)

### Windows (PowerShell)
```powershell
# 1. Executar setup script
.\docker-setup.ps1

# 2. Abrir no navegador
start http://localhost:3000

# 3. Login
# Usuário: admin
# Senha: 123456
```

### Linux/Mac (Bash)
```bash
# 1. Dar permissão
chmod +x docker-setup.sh

# 2. Executar setup script
./docker-setup.sh

# 3. Abrir no navegador
open http://localhost:3000

# 4. Login
# Usuário: admin
# Senha: 123456
```

---

## Arquitetura

```
┌──────────────────────────────────────────┐
│ Seu PC / Notebook                        │
│ ┌────────────────────────────────────┐   │
│ │ Backend      (porta 3000)          │   │
│ │ • API REST                         │   │
│ │ • Dashboard web                    │   │
│ │ • Recebe dados ESP32               │   │
│ ├────────────────────────────────────┤   │
│ │ Gateway      (porta 3001)          │   │
│ │ • Proxy/Load balancer              │   │
│ │ • Encaminha requests para Backend  │   │
│ ├────────────────────────────────────┤   │
│ │ MQTT Broker  (porta 1883)          │   │
│ │ • Mensagens entre serviços         │   │
│ └────────────────────────────────────┘   │
│           │                              │
│           │ TCP 5432                    │
│           ▼                              │
│ (BD Remoto em 100.82.140.119)           │
└──────────────────────────────────────────┘
         │
         │ HTTP
         ▼
    ESP32/ESP8266 (WiFi)
```

---

## Verificar Status

```bash
# Ver todos os containers
docker-compose -f docker-compose-remote.yml ps

# Ver logs em tempo real
docker-compose -f docker-compose-remote.yml logs -f

# Testar endpoints
curl http://localhost:3000/health
curl http://localhost:3001/health
```

---

## Gerenciar Serviços

```bash
# Parar tudo
docker-compose -f docker-compose-remote.yml down

# Restart do backend
docker-compose -f docker-compose-remote.yml restart backend

# Rebuild (se mudou código)
docker-compose -f docker-compose-remote.yml build --no-cache

# Limpar volumes
docker-compose -f docker-compose-remote.yml down -v
```

---

## Configurar ESP32

No código do ESP32, usar:

```cpp
#define API_URL "http://192.168.X.X:3000/api/telemetry"
// ou
#define API_URL "http://192.168.X.X:3001/api/telemetry"  // via gateway
```

Trocar `192.168.X.X` pelo IP do seu PC/Notebook.

---

## Próximos Passos

1. ✅ Executar `docker-setup.ps1` ou `docker-setup.sh`
2. ✅ Abrir http://localhost:3000
3. ✅ Fazer login (admin/123456)
4. ✅ Configurar ESP32 para enviar dados
5. ✅ Ver telemetria no dashboard

---

## Documentação Completa

Ver [DOCKER_SETUP.md](DOCKER_SETUP.md) para mais detalhes.
