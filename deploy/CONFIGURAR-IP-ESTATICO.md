# Configurar IP Estático no Raspberry Pi

Seu Raspberry Pi está com IP dinâmico (DHCP). Para acessá-lo externamente, você precisa fixar o IP.

## ⚡ Opção 1: Forma Rápida (Recomendada)

No Raspberry Pi, execute:

```bash
# Se usa Ethernet (eth0)
sudo bash /home/pi/myapp/deploy/configure-static-ip.sh eth0 192.168.1.100 192.168.1.1 8.8.8.8 8.8.4.4

# Se usa WiFi (wlan0)
sudo bash /home/pi/myapp/deploy/configure-static-ip.sh wlan0 192.168.1.100 192.168.1.1 8.8.8.8 8.8.4.4
```

**Parâmetros:**
- `eth0` ou `wlan0` - sua interface de rede
- `192.168.1.100` - IP que você quer (ajuste conforme sua rede)
- `192.168.1.1` - Gateway (roteador)
- `8.8.8.8` e `8.8.4.4` - DNS (Google)

---

## 🔧 Opção 2: Manual (se o script falhar)

No Raspberry Pi, abra o arquivo:

```bash
sudo nano /etc/dhcpcd.conf
```

Vá até o final do arquivo e adicione:

```bash
# Para Ethernet (eth0)
interface eth0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=8.8.8.8 8.8.4.4

# OU para WiFi (wlan0)
interface wlan0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=8.8.8.8 8.8.4.4
```

Pressione `Ctrl+X`, depois `Y` e `Enter` para salvar.

Reinicie o dhcpcd:
```bash
sudo systemctl restart dhcpcd
```

---

## ✅ Verificar a Configuração

```bash
# Ver IP atual
ip addr show

# Ver gateway
ip route show

# Testar conectividade
ping 8.8.8.8
```

---

## 🌐 Acesso Externo à Sua Rede

Depois de fixar o IP estático no Raspberry Pi, você precisa configurar seu **roteador** para acesso externo:

### 1. **Port Forwarding** (Essencial)

Acesse seu roteador (geralmente em `192.168.1.1` ou `192.168.0.1`):

```
Porta Externa       → Porta Interna      → IP do Raspberry
80 ou 8000         → 3000               → 192.168.1.100  (Backend)
8080 ou 8001       → 3001               → 192.168.1.100  (API Gateway)
```

### 2. **Descobrir seu IP Externo**

```bash
curl https://api.ipify.org
```

Aí você acessa de fora como:
- `http://SEU_IP_EXTERNO:8000` (backend)
- `http://SEU_IP_EXTERNO:8080` (API)

### 3. **Se o IP Externo for Dinâmico** (muda toda semana)

Use um serviço de **DDNS** (Dynamic DNS):
- [No-IP](https://www.noip.com/)
- [DuckDNS](https://www.duckdns.org/)
- [Dyndns](https://dyn.com/dns/)

Aí você acessa com um domínio ao invés de IP:
- `http://seu-dominio.noip.com:8000`

---

## 🛡️ Dicas de Segurança

1. **Mude a senha padrão** do Pi (`pi` / `raspberry`)
2. **Ativar firewall:**
   ```bash
   sudo ufw enable
   sudo ufw allow 22/tcp  # SSH
   sudo ufw allow 3000/tcp  # Backend
   sudo ufw allow 3001/tcp  # API
   ```
3. **Usar HTTPS** em produção (Let's Encrypt gratuito)

---

## 📝 Checklist

- [ ] IP estático configurado no Pi
- [ ] Interface de rede verificada (`eth0` ou `wlan0`)
- [ ] Port Forwarding configurado no roteador
- [ ] IP externo anotado ou DDNS configurado
- [ ] Serviços reiniciados: `sudo systemctl restart trabalho-final api-gateway`
- [ ] Testar acesso de dentro da rede: `curl http://192.168.1.100:3000`
- [ ] Testar acesso de fora: `curl http://SEU_IP_EXTERNO:8000`

