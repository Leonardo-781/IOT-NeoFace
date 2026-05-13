# 🔐 Guia do Arquivo .env

## O QUE É

O arquivo `.env` contém **variáveis de ambiente** que configuram todos os serviços Docker.

**Localização:**
```
~/trabalho-final/
├── .env          ← Este arquivo!
├── docker-compose-standalone.yml
└── ...
```

---

## 📝 VARIÁVEIS ATUAIS

O projeto já vem com `.env` configurado:

```env
# Core stack
POSTGRES_DB=iot_monitoring
POSTGRES_USER=iot_user
POSTGRES_PASSWORD=iot_pass123

# Backend / UI
LOGIN_USER=admin
LOGIN_PASSWORD=123456
BACKEND_PORT=3000
GATEWAY_PORT=3001

# Broker / ingest
MQTT_PORT=1883
INGEST_HTTP_PORT=3102

# Optional tuning
SIMULATION_INTERVAL_MS=5000
COMMAND_ACK_DELAY_MS=1200
MAX_TELEMETRY_POINTS=120
DB_RETENTION_DAYS=30
```

---

## 🎯 O QUE CADA VARIÁVEL FAZ

### 🗄️ Database

| Variável | Valor | O que é |
|----------|-------|--------|
| `POSTGRES_DB` | `iot_monitoring` | Nome do banco de dados |
| `POSTGRES_USER` | `iot_user` | Usuário de acesso |
| `POSTGRES_PASSWORD` | `iot_pass123` | Senha do banco |

### 🌐 Interface Web

| Variável | Valor | O que é |
|----------|-------|--------|
| `LOGIN_USER` | `admin` | Usuário padrão (web) |
| `LOGIN_PASSWORD` | `123456` | Senha padrão (web) |
| `BACKEND_PORT` | `3000` | Porta do dashboard |
| `GATEWAY_PORT` | `3001` | Porta do API Gateway |

### 📡 IoT / MQTT

| Variável | Valor | O que é |
|----------|-------|--------|
| `MQTT_PORT` | `1883` | Porta do MQTT Broker |
| `INGEST_HTTP_PORT` | `3102` | Porta de ingestion de dados |

### ⚙️ Tuning

| Variável | Valor | O que é |
|----------|-------|--------|
| `SIMULATION_INTERVAL_MS` | `5000` | Intervalo de simulação (ms) |
| `COMMAND_ACK_DELAY_MS` | `1200` | Delay de confirmação (ms) |
| `MAX_TELEMETRY_POINTS` | `120` | Máximo de pontos em memória |
| `DB_RETENTION_DAYS` | `30` | Dias de retenção de dados |

---

## ✏️ COMO CUSTOMIZAR

### Mudar Senha do Banco

```env
# De:
POSTGRES_PASSWORD=iot_pass123

# Para:
POSTGRES_PASSWORD=sua_senha_forte_123!
```

**Depois:**
```bash
# Remover banco antigo
docker-compose -f docker-compose-standalone.yml down -v

# Reconstruir com nova senha
docker-compose -f docker-compose-standalone.yml build
docker-compose -f docker-compose-standalone.yml up -d
```

### Mudar Login Web

```env
# De:
LOGIN_USER=admin
LOGIN_PASSWORD=123456

# Para:
LOGIN_USER=seu_usuario
LOGIN_PASSWORD=sua_senha
```

**Depois:**
```bash
# Restart dos serviços
docker-compose -f docker-compose-standalone.yml restart
```

### Mudar Portas

```env
# Se quer MQTT em 1884 em vez de 1883:
MQTT_PORT=1884

# Se quer Backend em 8000 em vez de 3000:
BACKEND_PORT=8000
```

**Depois:**
```bash
# Rebuild necessário
docker-compose -f docker-compose-standalone.yml down
docker-compose -f docker-compose-standalone.yml up -d
```

---

## 🔒 SEGURANÇA - PRODUÇÃO

### ⚠️ ANTES DE COLOCAR ONLINE

1. **Mude TODAS as senhas:**
   ```env
   POSTGRES_PASSWORD=algo_muito_forte_123!@#
   LOGIN_PASSWORD=senha_super_segura_456!@#
   ```

2. **Use senhas fortes:**
   ✅ `K#x9$mP2@w5Q!vL8`  
   ❌ `123456` ou `password`

3. **Não commite .env:**
   ```bash
   # Verificar
   cat .gitignore | grep .env
   
   # Se não tiver:
   echo ".env" >> .gitignore
   git add .gitignore
   git commit -m "Hide .env"
   ```

4. **Use secrets em produção:**
   - Docker Secrets (Swarm)
   - Kubernetes Secrets (K8s)
   - HashiCorp Vault
   - AWS Secrets Manager

---

## 🚀 APLICAR MUDANÇAS

### Sem Parar o Sistema

```bash
# Só restart dos serviços
docker-compose -f docker-compose-standalone.yml restart
```

### Com Rebuild (Recomendado)

```bash
# Parar
docker-compose -f docker-compose-standalone.yml down

# Rebuild com novas variáveis
docker-compose -f docker-compose-standalone.yml build

# Iniciar
docker-compose -f docker-compose-standalone.yml up -d
```

---

## 🔍 VERIFICAR VARIÁVEIS

### Ver o arquivo

```bash
cat .env
```

### Ver apenas um valor

```bash
grep BACKEND_PORT .env
```

### Validar sintaxe

```bash
# Docker fará parse automático
docker-compose config
```

---

## 🆘 ERROS COMUNS

### "Connection refused" ao MQTT

**Problema:** `MQTT_PORT` errado  
**Solução:**
```bash
# Verifique
grep MQTT_PORT .env

# Verifique o container
docker ps | grep mqtt
```

### "Login inválido"

**Problema:** `LOGIN_USER`/`LOGIN_PASSWORD` incorretos  
**Solução:**
```bash
# Verifique
grep LOGIN .env

# Restart
docker-compose restart
```

### "Database error"

**Problema:** `POSTGRES_PASSWORD` não corresponde  
**Solução:**
```bash
# Remover volume
docker-compose down -v

# Recrear com novo .env
docker-compose build
docker-compose up -d
```

---

## 📊 VALORES RECOMENDADOS

### Desenvolvimento

```env
SIMULATION_INTERVAL_MS=5000
MAX_TELEMETRY_POINTS=120
DB_RETENTION_DAYS=7
```

### Produção

```env
SIMULATION_INTERVAL_MS=10000        # Menos simulação
MAX_TELEMETRY_POINTS=1000          # Mais buffer
DB_RETENTION_DAYS=90               # Mais retenção
```

---

## 💾 BACKUP .env

Importante ter backup!

```bash
# Fazer backup
cp .env .env.backup

# Restaurar se necessário
cp .env.backup .env
```

---

## 📋 Checklist

- [ ] `.env` existe na raiz do projeto
- [ ] Contém todas as 14+ variáveis
- [ ] Senhas foram customizadas (se produção)
- [ ] `.gitignore` contém `.env`
- [ ] Docker consegue ler as variáveis
- [ ] Serviços iniciam corretamente
- [ ] Backup de `.env` foi feito

---

## 🎯 PRÓXIMOS PASSOS

1. **Se foi customize recente:**
   ```bash
   docker-compose down -v
   docker-compose build
   docker-compose up -d
   ```

2. **Se tudo já está OK:**
   ```bash
   docker-compose up -d
   ```

3. **Verificar:**
   ```bash
   curl http://100.82.140.119:3000
   ```

---

**Pronto para deploy?** Volte a [QUICK_START_ONLINE.md](QUICK_START_ONLINE.md) 🚀
