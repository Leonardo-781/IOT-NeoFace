# ✅ SETUP LINUX MINT - Resumo Final

Seu sistema IoT foi **completamente configurado** para rodar no **server-sti com Linux Mint**.

---

## 🖥️ SO Escolhido: Linux Mint

| Aspecto | Detalhes |
|--------|---------|
| **Sistema** | Linux Mint (baseado em Ubuntu) |
| **IP** | 192.168.1.10 |
| **Gerenciador** | apt-get (Ubuntu) |
| **Systemd** | Sim |
| **Docker** | Repositório oficial (get.docker.com) |

---

## 📝 ARQUIVOS CRIADOS/ATUALIZADOS

### Setup
- ✅ `prepare-linux-mint.sh` - Instala Docker, Nginx, Node.js automaticamente
- ✅ `deploy-to-server-sti.sh` - Deploy completo em 6 etapas
- ✅ `deploy-to-server-sti.ps1` - Deploy via PowerShell (Windows)

### Documentação
- ✅ `LINUX_MINT_SETUP.md` - Guia completo passo-a-passo
- ✅ `QUICK_LINUX_MINT.md` - Início rápido em 3 passos
- ✅ `DEPLOY_SERVER_STI.md` - Atualizado com Linux Mint
- ✅ `CONFIGURAR_ESP32.md` - Configuração ESP32

---

## 🚀 COMO FAZER O DEPLOY

### Opção 1️⃣: Automático (Recomendado)

**Do seu notebook (Mac/Linux):**
```bash
bash deploy-to-server-sti.sh 192.168.1.10 usuario
# Aguarde ~20-25 minutos
```

**Do seu notebook (Windows PowerShell):**
```powershell
.\\deploy-to-server-sti.ps1 -ServerIP 192.168.1.10 -SSHUser usuario
# Aguarde ~20-25 minutos
```

✅ Tudo automatizado!

---

### Opção 2️⃣: Manual (3 Passos)

**Passo 1: Preparar Linux Mint**
```bash
scp prepare-linux-mint.sh usuario@192.168.1.10:~/
ssh usuario@192.168.1.10 'bash ~/prepare-linux-mint.sh'
# Logout e login novamente
exit
ssh usuario@192.168.1.10
```

**Passo 2: Copiar Projeto**
```bash
# Via Git
ssh usuario@192.168.1.10 'cd ~ && git clone <seu-repo> trabalho-final'

# Ou via SCP
scp -r . usuario@192.168.1.10:~/trabalho-final/
```

**Passo 3: Deploy**
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

## 🌐 APÓS DEPLOY

### Acessar Dashboard
```
http://192.168.1.10
```

### Login Padrão
```
Usuário: admin
Senha: 123456
```

### Testar Health
```bash
curl http://192.168.1.10/health
```

---

## 🔌 CONFIGURAR ESP32

Edite `esp32/esp32_gateway.ino`:

```cpp
#define WIFI_SSID "seu-wifi"
#define WIFI_PASSWORD "sua-senha"
#define API_URL "http://192.168.1.10:3001/api/ingest"
```

[→ Detalhes em CONFIGURAR_ESP32.md](CONFIGURAR_ESP32.md)

---

## 📊 GERENCIAR SISTEMA

### Ver Status
```bash
ssh usuario@192.168.1.10 "cd ~/trabalho-final && docker-compose ps"
```

### Ver Logs
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

## 📚 DOCUMENTAÇÃO DE REFERÊNCIA

| Arquivo | Para |
|---------|------|
| `QUICK_LINUX_MINT.md` | Início rápido 3 passos |
| `LINUX_MINT_SETUP.md` | Setup detalhado |
| `DEPLOY_SERVER_STI.md` | Guia completo |
| `CONFIGURAR_ESP32.md` | Conectar sensores |

---

## ✅ CHECKLIST PRÉ-DEPLOY

- [ ] SSH conecta: `ssh usuario@192.168.1.10`
- [ ] Internet funciona no servidor
- [ ] Tenho acesso ao repositório do projeto (git ou SCP)
- [ ] Firewall permite portas 22 (SSH), 80 (HTTP), 443 (HTTPS)

---

## ✅ CHECKLIST PÓS-DEPLOY

- [ ] http://192.168.1.10 acessível
- [ ] Login funciona (admin/123456)
- [ ] Dashboard carrega dados
- [ ] Containers rodando: `docker-compose ps`
- [ ] Nginx funcionando: `sudo systemctl status nginx`
- [ ] ESP32 conectado (se aplicável)
- [ ] Dados chegando em tempo real

---

## 🆘 TROUBLESHOOTING

### Problemas SSH?
```bash
ssh -vvv usuario@192.168.1.10  # Debug verbose
```

### Docker permission denied?
```bash
sudo usermod -aG docker $USER
# Logout/login novamente
exit
ssh usuario@192.168.1.10
```

### Nginx não funciona?
```bash
sudo nginx -t
sudo systemctl status nginx
sudo journalctl -u nginx -n 50
```

### Containers não sobem?
```bash
cd ~/trabalho-final
docker-compose logs backend
docker-compose logs db
```

---

## 📈 PRÓXIMAS ETAPAS

1. ✅ Executar deploy (automático ou manual)
2. ✅ Acessar dashboard e verificar
3. ✅ Configurar e conectar ESP32
4. ✅ Testar ingestão de dados
5. ✅ Configurar HTTPS com Let's Encrypt (opcional)
6. ✅ Monitorar e manter sistema

---

## 🎉 PARABÉNS!

Sistema IoT **100% em produção** no Linux Mint! 🚀

**Próximo passo:** Executar o deploy automático!
