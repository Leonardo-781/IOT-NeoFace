# Comandos Para Subir o Sistema 🚀

## 1️⃣ PREPARE (Uma vez)

```bash
# Entrar na pasta do projeto
cd "C:\Users\Leonardo\OneDrive\Documentos\VS Code\Sistemas Distribuidos\Trabalho Final"

# Criar arquivo .env com configurações
cat > .env << EOF
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

---

## 2️⃣ BUILD (Primeira vez)

```bash
# Fazer download das imagens Docker e compilar
docker-compose -f docker-compose-remote.yml build
```

⏱️ **Leva ~5-10 minutos** (downloads da internet)

---

## 3️⃣ START (Principal)

```bash
# Subir TODOS os serviços
docker-compose -f docker-compose-remote.yml up -d

# Aguardar ~30 segundos para tudo iniciar
```

✅ Agora os serviços estão rodando em background

---

## 4️⃣ VERIFICAR STATUS

```bash
# Ver todos os containers
docker-compose -f docker-compose-remote.yml ps

# Saída esperada:
# NAME              STATUS         PORTS
# tf-backend        Up 2 minutes   0.0.0.0:3000->3000/tcp
# tf-gateway        Up 2 minutes   0.0.0.0:3001->3001/tcp
# tf-mqtt           Up 2 minutes   0.0.0.0:1883->1883/tcp
# tf-ingest         Up 2 minutes   0.0.0.0:3102->3102/tcp
```

---

## 5️⃣ TESTAR ENDPOINTS

```bash
# Backend está vivo?
curl http://localhost:3000/health

# Gateway está vivo?
curl http://localhost:3001/health

# Saída esperada:
# {"ok": true, "backend": "online", "database": "connected", ...}
```

---

## 6️⃣ ACESSAR NO NAVEGADOR

```
http://localhost:3000
```

**Login:**
```
Usuário: admin
Senha: 123456
```

---

## 📊 GERENCIAR SERVIÇOS

### Ver Logs em Tempo Real
```bash
# Todos os logs
docker-compose -f docker-compose-remote.yml logs -f

# Apenas Backend
docker-compose -f docker-compose-remote.yml logs -f backend

# Apenas MQTT
docker-compose -f docker-compose-remote.yml logs -f mqtt

# Últimas 100 linhas
docker-compose -f docker-compose-remote.yml logs --tail=100 backend
```

### Parar Serviços
```bash
# Parar (sem deletar dados)
docker-compose -f docker-compose-remote.yml down

# Parar um específico
docker-compose -f docker-compose-remote.yml stop backend

# Restart tudo
docker-compose -f docker-compose-remote.yml restart

# Restart Backend apenas
docker-compose -f docker-compose-remote.yml restart backend
```

### Limpar Tudo
```bash
# Parar e deletar containers (mantém volumes)
docker-compose -f docker-compose-remote.yml down

# Parar e deletar TUDO (incluindo volumes com dados)
docker-compose -f docker-compose-remote.yml down -v

# Rebuild completo
docker-compose -f docker-compose-remote.yml build --no-cache
```

---

## 🔄 FLUXO COMPLETO (Primeira Vez)

```bash
# 1. Entrar na pasta
cd "C:\Users\Leonardo\OneDrive\Documentos\VS Code\Sistemas Distribuidos\Trabalho Final"

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
NODE_ENV=production
EOF

# 3. Build (primeira vez)
docker-compose -f docker-compose-remote.yml build

# 4. Start
docker-compose -f docker-compose-remote.yml up -d

# 5. Verificar
docker-compose -f docker-compose-remote.yml ps

# 6. Testar
curl http://localhost:3000/health

# 7. Abrir navegador
# http://localhost:3000
```

---

## 🔄 FLUXO SIMPLES (Próximas Vezes)

```bash
# Entrar na pasta
cd "C:\Users\Leonardo\OneDrive\Documentos\VS Code\Sistemas Distribuidos\Trabalho Final"

# Subir
docker-compose -f docker-compose-remote.yml up -d

# Ver status
docker-compose -f docker-compose-remote.yml ps

# Abrir
# http://localhost:3000
```

---

## ⚙️ TROUBLESHOOTING

### Porta já em uso (3000, 3001, 1883)
```bash
# Encontrar o processo usando a porta
netstat -ano | findstr :3000

# Parar tudo primeiro
docker-compose -f docker-compose-remote.yml down

# Ou mudar a porta no .env
# BACKEND_PORT=3001  # em vez de 3000
```

### BD não conecta
```bash
# Ver logs do backend
docker-compose -f docker-compose-remote.yml logs backend

# Testar conexão manual
# Verificar se Raspberry está online:
ping 100.82.140.119

# Testar PostgreSQL:
psql -h 100.82.140.119 -U iot_user -d iot_monitoring -c "SELECT version();"
```

### Container não inicia
```bash
# Ver erro
docker-compose -f docker-compose-remote.yml logs -f backend

# Rebuild do 0
docker-compose -f docker-compose-remote.yml down -v
docker-compose -f docker-compose-remote.yml build --no-cache
docker-compose -f docker-compose-remote.yml up -d
```

### Remover imagem antiga e redownloadar
```bash
docker-compose -f docker-compose-remote.yml down
docker system prune -a
docker-compose -f docker-compose-remote.yml build --no-cache
docker-compose -f docker-compose-remote.yml up -d
```

---

## 📍 ENDPOINTS FINAIS

| URL | Função |
|-----|--------|
| http://localhost:3000 | Dashboard + API |
| http://localhost:3001 | Gateway (proxy) |
| mqtt://localhost:1883 | MQTT Broker |
| http://localhost:3102 | Ingest HTTP |

---

## 🎯 RESUMO RÁPIDO

```bash
# Primeira vez (5-10 min)
docker-compose -f docker-compose-remote.yml build
docker-compose -f docker-compose-remote.yml up -d

# Próximas vezes (1 segundo)
docker-compose -f docker-compose-remote.yml up -d

# Ver tudo funcionando
docker-compose -f docker-compose-remote.yml ps

# Abrir navegador
http://localhost:3000
```

Pronto! 🚀
