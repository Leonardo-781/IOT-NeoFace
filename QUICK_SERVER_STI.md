# ⚡ QUICK START - Server-STI

**Seu sistema IoT rodando em produção no server-sti (192.168.1.10)!**

---

## 🚀 Opção 1: Deploy Automático (Recomendado)

### Windows (PowerShell)
```powershell
.\\deploy-to-server-sti.ps1 -ServerIP 192.168.1.10 -SSHUser pi
```

### Mac / Linux
```bash
bash deploy-to-server-sti.sh 192.168.1.10 pi
```

✅ Aguarde ~10-15 minutos e estará pronto!

---

## 🚀 Opção 2: Deploy Manual (Passo-a-Passo)

### 1️⃣ SSH para server-sti
```bash
ssh pi@192.168.1.10
```

### 2️⃣ Clonar projeto
```bash
cd ~
git clone <https://github.com/Leonardo-781/IOT-NeoFace> trabalho-final
cd trabalho-final
```

### 3️⃣ Build e start
```bash
docker-compose build
docker-compose up -d
```

### 4️⃣ Configurar Nginx
```bash
sudo cp deploy/nginx/server-sti-nginx.conf /etc/nginx/sites-available/server-sti
sudo ln -s /etc/nginx/sites-available/server-sti /etc/nginx/sites-enabled/server-sti
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🌐 Acessar Dashboard

```
http://192.168.1.10
```

**Login:**
```
Usuário: admin
Senha: 123456
```

---

## 🔌 Configurar ESP32

Edite [esp32_gateway.ino](esp32/esp32_gateway.ino):

```cpp
#define API_URL "http://192.168.1.10:3001/api/ingest"
```

---

## 📊 Gerenciar

### Ver status
```bash
ssh pi@192.168.1.10 "cd ~/trabalho-final && docker-compose ps"
```

### Ver logs
```bash
ssh pi@192.168.1.10 "cd ~/trabalho-final && docker-compose logs -f backend"
```

### Parar
```bash
ssh pi@192.168.1.10 "cd ~/trabalho-final && docker-compose down"
```

---

## 📚 Próximos Passos

1. [→ DEPLOY_SERVER_STI.md](DEPLOY_SERVER_STI.md) - Guia completo
2. [→ CONFIGURAR_ESP32.md](CONFIGURAR_ESP32.md) - Conectar sensores

---

## ✅ Checklist

- [ ] SSH conecta: `ssh pi@192.168.1.10`
- [ ] Docker rodando: `docker-compose ps`
- [ ] Nginx funciona: http://192.168.1.10
- [ ] Login funciona: admin / 123456
- [ ] ESP32 enviando dados

**Pronto!** 🎉 Sistema em produção!
