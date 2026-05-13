# Quick Start - Setup Distribuído 🚀

## ⚡ RESUMO (Copiar e Colar)

### RASPBERRY PI (Uma vez - 10 min)

**No seu PC, execute:**
```bash
# SSH para Raspberry e rodinha automático
ssh pi@100.82.140.119 'bash -s' < setup-raspberry.sh

# Senha: raspberry
```

**Ou manualmente:**
```bash
ssh pi@100.82.140.119

sudo apt update
sudo apt install postgresql postgresql-contrib -y

sudo -u postgres psql
CREATE DATABASE iot_monitoring;
CREATE USER iot_user WITH PASSWORD 'iot_pass123';
GRANT ALL PRIVILEGES ON DATABASE iot_monitoring TO iot_user;
\q

# Ver IP do Raspberry
hostname -I
```

---

### NOTEBOOK (Primeira vez - 5 min)

```bash
# 1. Entrar na pasta
cd "C:\Users\Leonardo\OneDrive\Documentos\VS Code\Sistemas Distribuidos\Trabalho Final"

# 2. Criar .env
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

# 3. Build (primeira vez)
docker-compose -f docker-compose-remote.yml build

# 4. Start
docker-compose -f docker-compose-remote.yml up -d

# 5. Ver status
docker-compose -f docker-compose-remote.yml ps

# 6. Abrir
# http://localhost:3000
# Login: admin / 123456
```

---

## ✅ Verificação

```bash
# RASPBERRY: Testar PostgreSQL localmente
ssh pi@100.82.140.119
psql -U iot_user -d iot_monitoring -c "SELECT version();"
exit

# NOTEBOOK: Testar conexão remota
psql -h 100.82.140.119 -U iot_user -d iot_monitoring -c "SELECT version();"

# NOTEBOOK: Testar Backend
curl http://localhost:3000/health

# Deve retornar: {"ok": true, "backend": "online", "database": "connected"}
```

---

## 🔄 Próximas Vezes

```bash
# NOTEBOOK: Apenas iniciar
cd "C:\Users\Leonardo\OneDrive\Documentos\VS Code\Sistemas Distribuidos\Trabalho Final"
docker-compose -f docker-compose-remote.yml up -d

# Parar
docker-compose -f docker-compose-remote.yml down
```

---

## 📍 ENDPOINTS

| Máquina | Porta | URL |
|---------|-------|-----|
| Raspberry | 5432 | 100.82.140.119:5432 |
| Notebook | 3000 | http://localhost:3000 |
| Notebook | 3001 | http://localhost:3001 |
| Notebook | 1883 | mqtt://localhost:1883 |

---

Ver [SETUP_DISTRIBUIDO.md](SETUP_DISTRIBUIDO.md) para detalhes! 📖
