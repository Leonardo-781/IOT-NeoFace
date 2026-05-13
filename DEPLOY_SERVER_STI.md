# 🚀 DEPLOY - Server-STI (Linux Mint)

Sistema IoT implantado em **servidor remoto com Linux Mint** (192.168.1.10).

---

## 📋 Pré-requisitos

### No server-sti (Linux Mint):
- ✅ SSH acessível
- ✅ Docker instalado
- ✅ Docker Compose v2+
- ✅ ~4GB RAM
- ✅ Nginx instalado (proxy reverso)

### No seu notebook:
- ✅ SSH key configurada
- ✅ Git ou SCP para copiar projeto

---

## 🎯 1. Preparar Server-STI com Linux Mint (SSH)

### Conectar
```bash
ssh usuario@192.168.1.10
```

### Atualizar sistema (Linux Mint)
```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y software-properties-common
```

### Instalar dependências
```bash
# Docker (adicionar repositório oficial)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose
sudo apt install -y docker-compose

# Nginx
sudo apt install -y nginx

# Node.js (opcional - para scripts)
sudo apt install -y nodejs npm

# Git
sudo apt install -y git

# Ferramentas úteis
sudo apt install -y curl wget htop
```

### Adicionar usuário ao grupo docker
```bash
sudo usermod -aG docker $USER

# Fazer logout e login novamente
exit
ssh usuario@192.168.1.10
```

### Verificar instalação
```bash
docker --version
docker-compose --version
nginx -v
```

---

## 📤 2. Copiar Projeto para Server-STI

### Opção A: Git Clone (recomendado)

Na sessão SSH do server-sti:

```bash
cd ~
git clone <seu-repo-url> trabalho-final
cd trabalho-final
```

### Opção B: SCP (copiar manualmente)

No seu notebook (PowerShell/Terminal):

```bash
# Windows
scp -r "C:\Users\Leonardo\OneDrive\Documentos\VS Code\Sistemas Distribuidos\Trabalho Final" usuario@192.168.1.10:~/trabalho-final

# Mac/Linux
scp -r ~/trabalho-final usuario@192.168.1.10:~/
```

---

## 🐳 3. Deploy via Docker Compose

Na sessão SSH do server-sti:

```bash
cd ~/trabalho-final

# Build das imagens
docker-compose build

# Iniciar (em background)
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f backend
```

---

## 🌐 4. Configurar Nginx (Proxy Reverso)

O Nginx vai expor o sistema na porta 80 (HTTP).

### Copiar arquivo de configuração

```bash
sudo cp deploy/nginx/server-sti-nginx.conf /etc/nginx/sites-available/server-sti

# Mude o server_name se necessário:
sudo nano /etc/nginx/sites-available/server-sti
```

Edite para:

```nginx
server {
    listen 80;
    server_name 192.168.1.10;  # ← Seu IP do server-sti

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Habilitar site

```bash
sudo ln -s /etc/nginx/sites-available/server-sti /etc/nginx/sites-enabled/server-sti

# Testar configuração
sudo nginx -t

# Recarregar
sudo systemctl reload nginx
```

---

## ✅ 5. Acessar Dashboard

### Do notebook (mesma rede)
```
http://192.168.1.10
```

### Do exterior (se houver acesso remoto)
```
http://<ip-publico-do-server>
```

### Login padrão
```
Usuário: admin
Senha: 123456
```

---

## 🔌 6. Configurar ESP32

Edite [esp32_gateway.ino](esp32/esp32_gateway.ino):

```cpp
#define WIFI_SSID "seu-wifi"
#define WIFI_PASSWORD "sua-senha"
#define API_URL "http://192.168.1.10:3001/api/ingest"  // ← IP do server-sti
#define GATEWAY_ID "GW01"
```

---

## 📊 7. Banco de Dados

### Conectar via SSH (Port Forwarding)

No seu notebook:

```bash
# Criar túnel SSH
ssh -L 5432:localhost:5432 usuario@192.168.1.10

# Em outra aba/terminal:
psql -h localhost -U iot_user -d iot_monitoring
# Senha: iot_pass123
```

---

## 🛠️ 8. Gerenciar Serviços

### Ver status
```bash
ssh usuario@192.168.1.10
cd ~/trabalho-final
docker-compose ps
```

### Ver logs
```bash
docker-compose logs -f backend
docker-compose logs -f db
```

### Reiniciar
```bash
docker-compose restart
```

### Parar
```bash
docker-compose down
```

---

## 🆘 Troubleshooting

### Nginx não funciona
```bash
sudo nginx -t
sudo journalctl -u nginx -n 20
```

### Docker permission denied
```bash
sudo usermod -aG docker $USER
# Logout e login novamente
```

### Porta 80 já em uso
```bash
sudo lsof -i :80
sudo systemctl status <serviço>
```

### Não consegue conectar ao backend
```bash
# Verificar se containers estão rodando
docker ps

# Ver logs
docker-compose logs backend

# Testar conectividade local
curl http://127.0.0.1:3000/health
```

---

## 📈 Performance & Monitoring

### Ver uso de recursos
```bash
docker stats
```

### Aumentar memória se necessário
```bash
# Editar limits no docker-compose.yml
services:
  backend:
    mem_limit: 512m  # ← Adicionar limit
```

---

## 🔒 Segurança (Opcional)

### HTTPS com Let's Encrypt
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

### Firewall
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

---

## ✨ Resumo

| Etapa | Comando |
|-------|---------|
| **SSH** | `ssh usuario@192.168.1.10` |
| **Deploy** | `docker-compose up -d` |
| **Acessar** | `http://192.168.1.10` |
| **Ver logs** | `docker-compose logs -f` |
| **Parar** | `docker-compose down` |

**Sistema IoT rodando em produção!** 🎉
