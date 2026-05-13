# 🎬 PLANO DE EXECUÇÃO - Sistema 100% Online

## Fase 1: Preparação (Seu Notebook)

### 1.1 Preparar o Projeto

```bash
# Clone do repositório (ou use pasta já existente)
cd ~/trabalho-final
git pull origin main

# Ou simplesmente verifique se tem os arquivos:
ls -la docker-compose-standalone.yml
ls -la quick-install-raspberry.sh
```

### 1.2 Verificar Conectividade

```bash
# Teste conectar no Raspberry
ping 100.82.140.119

# Se funcionar: ✅
# Se der timeout: ❌ Ajuste IP ou verifique rede
```

---

## Fase 2: Deploy no Raspberry (3 Opções)

### OPÇÃO A: Automático (Recomendado)

**Tempo:** ~15-20 minutos

```bash
# 1. SSH para Raspberry
ssh pi@100.82.140.119

# 2. Clone/Copie o projeto
cd ~
git clone <seu-repo> trabalho-final
# OU copie manualmente

# 3. Execute script único
cd trabalho-final
bash quick-install-raspberry.sh

# 4. Pronto! Sistema online
```

---

### OPÇÃO B: Manual Step-by-Step

**Tempo:** ~10-15 minutos (entende cada passo)

```bash
# 1. SSH
ssh pi@100.82.140.119

# 2. Instalar Docker (se não tiver)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker pi

# 3. Instalar Docker Compose
sudo apt-get install docker-compose -y

# 4. Copiar projeto
scp -r ~/trabalho-final pi@100.82.140.119:~/

# OU git clone na Raspberry
git clone <seu-repo> ~/trabalho-final

# 5. Entrar na pasta
cd ~/trabalho-final

# 6. Build
docker-compose -f docker-compose-standalone.yml build

# 7. Start
docker-compose -f docker-compose-standalone.yml up -d

# 8. Verificar
docker-compose -f docker-compose-standalone.yml ps
```

---

### OPÇÃO C: Híbrido (Máximo Controle)

```bash
# 1. Do seu Notebook, copie tudo
scp -r . pi@100.82.140.119:~/trabalho-final

# 2. SSH para Raspberry
ssh pi@100.82.140.119

# 3. Verifique os arquivos
ls ~/trabalho-final/docker-compose-standalone.yml

# 4. Editar env (se precisar)
nano ~/trabalho-final/.env

# 5. Build
docker-compose -f ~/trabalho-final/docker-compose-standalone.yml build

# 6. Start
docker-compose -f ~/trabalho-final/docker-compose-standalone.yml up -d

# 7. Logs em tempo real
docker-compose -f ~/trabalho-final/docker-compose-standalone.yml logs -f
```

---

## Fase 3: Validação (Seu Notebook)

### 3.1 Verificar Serviços

```bash
# SSH Raspberry
ssh pi@100.82.140.119

# Listar containers
docker ps

# Esperado:
# CONTAINER ID    IMAGE         STATUS      PORTS
# xxxxx            postgre       Up 5 min    5432/tcp
# xxxxx            mosquitto     Up 5 min    1883/tcp
# xxxxx            backend       Up 5 min    3000/tcp
# xxxxx            api-gateway   Up 5 min    3001/tcp
# xxxxx            ingest        Up 5 min    3102/tcp
```

### 3.2 Testar Conectividade

```bash
# De seu notebook, teste cada serviço

# 1. Backend
curl http://100.82.140.119:3000/health
# Esperado: {"status":"ok","message":"API is running"}

# 2. API Gateway
curl http://100.82.140.119:3001/
# Esperado: resposta do gateway

# 3. Database (telnet)
telnet 100.82.140.119 5432
# Esperado: "PostgreSQL" header (ou timeout aceita também)

# 4. MQTT (pode usar mqtt-explorer GUI)
# Conexão: 100.82.140.119:1883
# Topic: home/+/+
```

### 3.3 Testar Web UI

```bash
# Abra no navegador
http://100.82.140.119:3000

# Login: admin / 123456

# Esperado: Dashboard carregado com dados
```

---

## Fase 4: Acessar de Qualquer Lugar

### Do Seu Notebook na Mesma Rede

```
http://100.82.140.119:3000
```

### Do Seu Celular na Mesma WiFi

```
http://100.82.140.119:3000
```

### De Fora (requer Port Forwarding)

```bash
# Seu roteador precisa fazer forward:
# Porta Externa (ex: 8080) → Raspberry 100.82.140.119:3000

# Depois acesse de qualquer lugar:
# http://<seu-ip-publico>:8080
```

---

## Fase 5: Configurar Auto-Start

### 5.1 Cron Job (Automático ao Reboot)

```bash
# SSH Raspberry
ssh pi@100.82.140.119

# Editar crontab
crontab -e

# Adicionar linha:
@reboot sleep 30 && cd ~/trabalho-final && docker-compose -f docker-compose-standalone.yml up -d
```

### 5.2 Systemd Service (Mais robusto)

Já existe em `deploy/trabalho-final.service` - use se quiser mais controle.

---

## 🆘 Se Algo Não Funcionar

### Container não inicia

```bash
# Ver logs
docker-compose -f docker-compose-standalone.yml logs -f

# Parar e limpar
docker-compose -f docker-compose-standalone.yml down

# Remover volumes (cuidado! apaga dados)
docker-compose -f docker-compose-standalone.yml down -v

# Reconstruir
docker-compose -f docker-compose-standalone.yml build --no-cache
docker-compose -f docker-compose-standalone.yml up -d
```

### Conectividade

```bash
# Verificar IP
hostname -I

# Verificar porta
netstat -tlnp | grep 3000

# Ping do seu PC
ping <ip-raspberry>

# Testar localhost (SSH Raspberry)
curl localhost:3000/health
```

### Database vazio

```bash
# Executar schema
docker exec trabalho_final-db-1 psql -U iot_user -d iot_monitoring -f /sql/timescaledb-schema.sql

# Ou via docker
docker-compose -f docker-compose-standalone.yml exec db psql -U iot_user -d iot_monitoring -c "CREATE TABLE users (id SERIAL PRIMARY KEY);"
```

---

## 📊 Status Final

Quando tudo funcionar:

```
✅ Backend rodando        http://100.82.140.119:3000
✅ API Gateway rodando    http://100.82.140.119:3001
✅ MQTT Broker rodando    mqtt://100.82.140.119:1883
✅ Database rodando       postgresql://100.82.140.119:5432
✅ Ingest Service rodando http://100.82.140.119:3102
✅ Sistema 24/7 Online
✅ Auto-restart habilitado
✅ Pronto para ESP32!
```

---

## 🎉 Parabéns!

Seu sistema distribuído está:
- ✅ Autossuficiente (sem notebook)
- ✅ Sempre online (24/7)
- ✅ Containerizado (fácil deploy)
- ✅ Persistente (dados salvos)
- ✅ Escalável (pronto para mais sensores)

**Você pode agora usar seu notebook para outra coisa!** 💻➡️😴

---

## 📞 Suporte Rápido

| Problema | Comando |
|----------|---------|
| Ver logs | `docker-compose -f docker-compose-standalone.yml logs -f` |
| Parar | `docker-compose -f docker-compose-standalone.yml down` |
| Reiniciar | `docker-compose -f docker-compose-standalone.yml restart` |
| Status | `docker-compose -f docker-compose-standalone.yml ps` |
| Limpar | `docker-compose -f docker-compose-standalone.yml down -v` |
| SSH Rasp | `ssh pi@100.82.140.119` |
| Upload | `scp -r . pi@100.82.140.119:~/` |

---

**Boa sorte! 🚀**
