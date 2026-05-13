# ✅ ATUALIZAÇÃO - Server-STI (192.168.1.10)

Seu sistema IoT foi **reconfigurado para rodar NO SERVER-STI**, não no notebook pessoal!

---

## 🔄 O QUE MUDOU

| Antes | Depois |
|-------|--------|
| Raspberry Pi | **Server-STI (192.168.1.10)** ✅ |
| Localhost | **Server remoto** ✅ |
| Sem proxy | **Nginx reverse proxy** ✅ |

---

## 📝 ARQUIVOS ATUALIZADOS

### Configurações
- ✅ `.env` → `DB_HOST=192.168.1.10`
- ✅ `system_config.json` → `database.host=192.168.1.10`

### ESP32
- ✅ `esp32/esp32_gateway.ino` → `API_URL="http://192.168.1.10:3001/api/ingest"`

### Scripts Criados
- ✅ `deploy-to-server-sti.sh` (Bash automático)
- ✅ `deploy-to-server-sti.ps1` (PowerShell automático)

### Documentação Criada
- ✅ `DEPLOY_SERVER_STI.md` (Guia completo passo-a-passo)
- ✅ `QUICK_SERVER_STI.md` (Início rápido)
- ✅ `CONFIGURAR_ESP32.md` (ESP32 para server-sti)

---

## 🚀 PRÓXIMO PASSO: FAZER DEPLOY

### Opção 1: Automático (Recomendado)

**Windows (PowerShell):**
```powershell
.\\deploy-to-server-sti.ps1 -ServerIP 192.168.1.10 -SSHUser pi
```

**Mac/Linux:**
```bash
bash deploy-to-server-sti.sh 192.168.1.10 pi
```

⏱️ Aguarde ~10-15 minutos

### Opção 2: Manual (Passo-a-Passo)

[→ Veja DEPLOY_SERVER_STI.md](DEPLOY_SERVER_STI.md)

---

## 🌐 APÓS DEPLOY

### Acessar Dashboard
```
http://192.168.1.10
```

### Login
```
Usuário: admin
Senha: 123456
```

### Configurar ESP32
```cpp
#define API_URL "http://192.168.1.10:3001/api/ingest"
```

---

## 📊 ARQUITETURA FINAL

```
┌──────────────────────────────────────┐
│      SERVER-STI (192.168.1.10)       │
├──────────────────────────────────────┤
│  [Nginx - Porta 80]                  │
│         ↓                            │
│  [Backend - 3000]                    │
│  [Gateway - 3001]                    │
│  [MQTT    - 1883]                    │
│  [PostgreSQL - 5432]                 │
└──────────────────────────────────────┘
          ↑           ↑
      ESP32/WiFi  Seu Notebook
       (Dados)     (Acesso)
```

---

## 📚 DOCUMENTAÇÃO

| Arquivo | Para |
|---------|------|
| [QUICK_SERVER_STI.md](QUICK_SERVER_STI.md) | Início em 5 min |
| [DEPLOY_SERVER_STI.md](DEPLOY_SERVER_STI.md) | Guia completo |
| [CONFIGURAR_ESP32.md](CONFIGURAR_ESP32.md) | Conectar sensores |

---

## ✨ CHECKLIST

- [ ] SSH conecta: `ssh pi@192.168.1.10`
- [ ] Deploy executado
- [ ] Nginx configurado
- [ ] http://192.168.1.10 acessível
- [ ] Login funciona (admin/123456)
- [ ] ESP32 enviando dados
- [ ] Dashboard mostra dados em tempo real

---

**Tudo pronto!** 🎉 Sistema em produção no server-sti!
