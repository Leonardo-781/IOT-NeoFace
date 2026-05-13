# 🐧 LINUX MINT - Setup para Server-STI

Guia específico para configurar o sistema IoT em **Linux Mint 192.168.1.10**.

---

## ✅ Pré-requisitos

- ✅ Linux Mint instalado e atualizado
- ✅ SSH habilitado
- ✅ Usuário com permissões sudo

---

## 🚀 Opção 1: Setup Automático (Recomendado)

No seu notebook, execute:

```bash
# Do seu notebook, faça upload e execute no server-sti
scp prepare-linux-mint.sh usuario@192.168.1.10:~/

ssh usuario@192.168.1.10
bash ~/prepare-linux-mint.sh

# Após conclusão:
exit
ssh usuario@192.168.1.10
```

✅ Tudo pronto!

---

## 🚀 Opção 2: Setup Manual (Passo-a-Passo)

### 1️⃣ SSH para Linux Mint

```bash
ssh usuario@192.168.1.10
```

### 2️⃣ Atualizar sistema

```bash
sudo apt update
sudo apt upgrade -y
```

### 3️⃣ Instalar Docker

```bash
# Dependências
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Adicionar repositório Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### 4️⃣ Instalar complementos

```bash
sudo apt install -y nginx nodejs npm git
```

### 5️⃣ Configurar permissões Docker

```bash
sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker

# Logout e login novamente
exit
ssh usuario@192.168.1.10
```

### 6️⃣ Verificar instalação

```bash
docker --version
docker-compose --version
nginx -v
node --version
```

---

## 📝 Observações Linux Mint

| Aspecto | Nota |
|--------|------|
| **Gerenciador de Pacotes** | apt (igual Ubuntu) |
| **Repositórios** | Ubuntu oficial funciona |
| **Systemd** | Sim, funciona normalmente |
| **Firewall** | UFW (opcional) |
| **NetworkManager** | Padrão, gerencia conexões |

---

## 🔧 Depois do Setup

### Fazer deploy do projeto

```bash
cd ~/trabalho-final
docker-compose build
docker-compose up -d
```

### Configurar Nginx

```bash
sudo cp deploy/nginx/server-sti-nginx.conf /etc/nginx/sites-available/server-sti
sudo ln -s /etc/nginx/sites-available/server-sti /etc/nginx/sites-enabled/server-sti
sudo nginx -t
sudo systemctl reload nginx
```

### Acessar

```
http://192.168.1.10
```

---

## 🆘 Troubleshooting

### Docker: permission denied

```bash
# Refazer setup de grupo
sudo usermod -aG docker $USER
sudo systemctl restart docker

# Logout/login
exit
ssh usuario@192.168.1.10
```

### Nginx: port 80 em uso

```bash
sudo systemctl status nginx
sudo lsof -i :80
```

### Atualizar sistema

```bash
sudo apt update
sudo apt upgrade -y
```

---

## ✨ Checklist

- [ ] SSH conecta
- [ ] `docker --version` funciona
- [ ] `nginx -v` funciona
- [ ] `node --version` funciona
- [ ] Projeto clonado em ~/trabalho-final
- [ ] `docker-compose build` executado
- [ ] `docker-compose up -d` rodando
- [ ] http://192.168.1.10 acessível

✅ **Pronto!** Sistema em produção no Linux Mint! 🚀
