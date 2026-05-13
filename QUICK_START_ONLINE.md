# 🚀 Quick Start - 100% Online Raspberry Pi

## ⚡ RESUMO (3 Passos)

### 1️⃣ SSH no Raspberry e Clonar Projeto

```bash
ssh pi@100.82.140.119

# Opção A: Se tiver Git
git clone https://seu-repo.git ~/trabalho-final

# Opção B: Copiar do seu PC
# No seu PC (PowerShell):
scp -r "C:\Users\Leonardo\OneDrive\Documentos\VS Code\Sistemas Distribuidos\Trabalho Final\*" pi@100.82.140.119:~/trabalho-final

# De volta no Raspberry:
cd ~/trabalho-final
```

### 2️⃣ Executar Script de Instalação

```bash
bash quick-install-raspberry.sh

# Ou executar passo-a-passo:
curl -sSL https://get.docker.com | sh
sudo usermod -aG docker pi
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-Linux-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Sair e reconectar
exit
ssh pi@100.82.140.119
cd ~/trabalho-final
```

### 3️⃣ Build e Start

```bash
docker-compose -f docker-compose-standalone.yml build

docker-compose -f docker-compose-standalone.yml up -d

docker-compose -f docker-compose-standalone.yml ps
```

---

## 🌐 Acessar de Qualquer Lugar

### Do seu PC/Notebook/Celular

```
Dashboard:  http://100.82.140.119:3000
API:        http://100.82.140.119:3001
MQTT:       mqtt://100.82.140.119:1883
PostgreSQL: psql -h 100.82.140.119 -U iot_user -d iot_monitoring
```

### Do ESP32

```cpp
const char* serverURL = "http://100.82.140.119:3000/api/telemetry";
```

---

## 📊 O Que Está Rodando

| Container | Porta | Serviço |
|-----------|-------|---------|
| tf-db | 5432 | PostgreSQL |
| tf-backend | 3000 | Backend + UI |
| tf-gateway | 3001 | API Gateway |
| tf-mqtt | 1883 | MQTT Broker |
| tf-ingest | 3102 | Ingest Service |

---

## 🔄 Gerenciar

### Ver Status

```bash
ssh pi@100.82.140.119
cd ~/trabalho-final
docker-compose -f docker-compose-standalone.yml ps
```

### Ver Logs

```bash
docker-compose -f docker-compose-standalone.yml logs -f backend
```

### Parar Tudo

```bash
docker-compose -f docker-compose-standalone.yml down
```

### Reiniciar

```bash
docker-compose -f docker-compose-standalone.yml restart
```

---

## ✅ Verificação

```bash
# Testar do seu PC
curl http://100.82.140.119:3000/health

# Esperado:
# {"ok": true, "backend": "online", "database": "connected"}
```

---

## 🎯 Resultado

✅ **Tudo Online 24/7 no Raspberry**
✅ **Nenhuma dependência do Notebook**
✅ **Auto-inicia após reboot**
✅ **Acessível de qualquer lugar da rede**

**Pronto!** 🚀

Ver [SETUP_RASPBERRY_STANDALONE.md](SETUP_RASPBERRY_STANDALONE.md) para detalhes.
