# ⚡ QUICK START - Linux Mint + Server-STI

**Seu sistema IoT rodando em produção no Linux Mint (192.168.1.10)!**

---

## 🚀 Opção 1: Deploy Automático Completo (Recomendado)

No seu notebook (Windows/Mac/Linux), execute:

### Linux/Mac
```bash
bash deploy-to-server-sti.sh 192.168.1.10 usuario
```

### Windows (PowerShell)
```powershell
.\\deploy-to-server-sti.ps1 -ServerIP 192.168.1.10 -SSHUser usuario
```

✅ Aguarde ~20-25 minutos

---

## 🚀 Opção 2: Setup Manual em 3 Passos

### 1️⃣ Preparar Linux Mint

No seu notebook:

```bash
scp prepare-linux-mint.sh usuario@192.168.1.10:~/
ssh usuario@192.168.1.10 'bash ~/prepare-linux-mint.sh'

# Logout e login novamente
exit
ssh usuario@192.168.1.10
```

### 2️⃣ Copiar Projeto

```bash
# Option A: Git clone
ssh usuario@192.168.1.10 'cd ~ && git clone <seu-repo-url> trabalho-final'

# Option B: SCP
scp -r . usuario@192.168.1.10:~/trabalho-final/
```

### 3️⃣ Deploy

```bash
ssh usuario@192.168.1.10
cd ~/trabalho-final
docker-compose build
docker-compose up -d
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

## 🔌 Próximas Ações

1. [→ CONFIGURAR_ESP32.md](CONFIGURAR_ESP32.md) - Conectar sensores
2. [→ DEPLOY_SERVER_STI.md](DEPLOY_SERVER_STI.md) - Guia completo
3. [→ LINUX_MINT_SETUP.md](LINUX_MINT_SETUP.md) - Troubleshooting

---

## 📊 Gerenciar Sistema

### Ver status
```bash
ssh usuario@192.168.1.10 "cd ~/trabalho-final && docker-compose ps"
```

### Ver logs
```bash
ssh usuario@192.168.1.10 "cd ~/trabalho-final && docker-compose logs -f backend"
```

### Reiniciar
```bash
ssh usuario@192.168.1.10 "cd ~/trabalho-final && docker-compose restart"
```

### Parar
```bash
ssh usuario@192.168.1.10 "cd ~/trabalho-final && docker-compose down"
```

---

## ✅ Checklist

- [ ] SSH conecta: `ssh usuario@192.168.1.10`
- [ ] Docker rodando: `docker -v`
- [ ] Projeto clonado: `ls ~/trabalho-final`
- [ ] Containers rodando: `docker-compose ps`
- [ ] Nginx funcionando: http://192.168.1.10
- [ ] Login funciona: admin / 123456
- [ ] ESP32 conectado (se aplicável)

**Pronto!** 🎉 Sistema em produção no Linux Mint!
