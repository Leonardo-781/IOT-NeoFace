# 🚀 SISTEMA DISTRIBUÍDO 100% ONLINE

## Bem-vindo! 👋

Você tem um sistema completo de IoT distribuído pronto para usar. **Escolha seu caminho:**

---

## ⚡ 3 OPÇÕES PARA COMEÇAR

### 🏃 OPÇÃO 1: RÁPIDO (5 minutos)
Quer começar agora?
```
→ Leia: QUICK_START_ONLINE.md
→ Execute: bash quick-install-raspberry.sh
→ Pronto! ✅
```

### 📖 OPÇÃO 2: ENTENDER (15 minutos)
Quer saber como funciona?
```
→ Leia: COMPARACAO_ARQUITETURAS.md (antes vs depois)
→ Leia: PLANO_EXECUCAO.md (passo-a-passo com 5 fases)
→ Execute: Siga os comandos
```

### 📚 OPÇÃO 3: CONTROLE TOTAL (30 minutos)
Quer aprender tudo em detalhes?
```
→ Leia: INDICE_MASTER.md (mapa completo)
→ Leia: SETUP_RASPBERRY_STANDALONE.md (detalhado)
→ Execute: Passo-a-passo manual
```

---

## 🎯 O QUE VOCÊ TEM

```
Sistema Distribuído com:
├── 🏠 Backend + Database no Raspberry Pi
├── 📊 Dashboard web em tempo real
├── 📡 MQTT Broker para IoT
├── 🔌 API Gateway para ESP32
├── 💾 PostgreSQL com TimescaleDB
├── 🐳 Tudo containerizado com Docker
└── ✅ 100% Online 24/7 (sem notebook!)
```

---

## 🎬 COMECE AQUI (3 PASSOS)

### Passo 1️⃣: SSH no Raspberry
```bash
ssh pi@100.82.140.119
```

### Passo 2️⃣: Clone/Copie o Projeto
```bash
git clone <seu-repo> ~/trabalho-final
# OU copie manualmente
cd ~/trabalho-final
```

### Passo 3️⃣: Execute Setup Automático
```bash
bash quick-install-raspberry.sh
```

**Pronto!** 🎉
- Acesse: http://100.82.140.119:3000
- Login: `admin` / `123456`
- Sistema rodando: ✅

---

## 📚 DOCUMENTOS PRINCIPAIS

| Arquivo | Leia Se... |
|---------|-----------|
| **QUICK_START_ONLINE.md** | Quer começar em 3 passos |
| **PLANO_EXECUCAO.md** | Quer 5 fases com troubleshooting |
| **COMPARACAO_ARQUITETURAS.md** | Quer ver ANTES vs DEPOIS |
| **INDICE_MASTER.md** | Quer mapa completo de tudo |
| **DOCKER_QUICKSTART.md** | Quer referência de comandos Docker |

---

## 🏗️ ARQUITETURA

### ANTES (Com Notebook)
```
Raspberry    Notebook         ESP32
   DB    ←→   App+Dashboard  ←→ WiFi
  (😴)      (PRECISA LIGADO)    Sensores
```
**Problema:** Notebook desligado = Sistema fora

### DEPOIS (100% Online)
```
┌────────────────────────────────────┐
│     Raspberry Pi (SEMPRE ONLINE)   │
│  ├─ Database                       │
│  ├─ Backend                        │
│  ├─ Dashboard                      │
│  ├─ MQTT Broker                    │
│  └─ API Gateway                    │
└────────────────────────────────────┘
         ↑           ↑
    ESP32 WiFi   Seu Notebook
                  (pode desligar!)
```
**Vantagem:** Tudo roda no Raspberry 24/7! ✅

---

## 🐳 SERVIÇOS INCLUSOS

| Serviço | Porta | Propósito |
|---------|-------|----------|
| Backend | 3000 | Dashboard + API |
| Gateway | 3001 | Proxy para ESP32 |
| MQTT | 1883 | Mensageria IoT |
| Database | 5432 | PostgreSQL |
| Ingest | 3102 | Serviço de ingestion |

---

## ✅ PRÉ-REQUISITOS

- ✅ Raspberry Pi com Docker instalado
- ✅ Conectado na rede (IP: 100.82.140.119)
- ✅ SSH funciona
- ✅ Este projeto clonado/copiado

**Tudo pronto?** Vá para **QUICK_START_ONLINE.md** 👉

---

## 🆘 ALGO DEU ERRADO?

1. **Docker não funciona?**
   → Veja seção "Docker não inicia" em **PLANO_EXECUCAO.md**

2. **Não consegue conectar?**
   → Veja seção "Conectividade" em **PLANO_EXECUCAO.md**

3. **Database está vazio?**
   → Veja seção "Database vazio" em **PLANO_EXECUCAO.md**

4. **Precisa de mais ajuda?**
   → Leia **SETUP_RASPBERRY_STANDALONE.md** completo

---

## 🔍 VERIFICAR STATUS

```bash
# Conecte no Raspberry
ssh pi@100.82.140.119

# Veja todos os serviços
docker ps

# Teste backend
curl http://localhost:3000/health

# Logs em tempo real
docker-compose -f docker-compose-standalone.yml logs -f
```

---

## 💡 DICAS RÁPIDAS

**Primeiro Deploy?**
```bash
bash quick-install-raspberry.sh
```

**Já tem Docker, só quer rodar?**
```bash
docker-compose -f docker-compose-standalone.yml up -d
```

**Quer parar o sistema?**
```bash
docker-compose -f docker-compose-standalone.yml down
```

**Quer ver logs?**
```bash
docker-compose -f docker-compose-standalone.yml logs -f
```

---

## 📊 CHECKLIST FINAL

- [ ] SSH funciona no Raspberry
- [ ] Docker instalado (`docker --version`)
- [ ] Projeto copiado para Raspberry
- [ ] Script executado ou docker-compose rodando
- [ ] Acesse http://100.82.140.119:3000
- [ ] Login com admin/123456 funciona
- [ ] Dashboard carrega sem erros
- [ ] ✅ Sistema online!

---

## 🎯 PRÓXIMOS PASSOS

1. **Deploy**: Execute setup (3 passos acima)
2. **Configurar ESP32**: Aponte para `100.82.140.119:1883` (MQTT)
3. **Monitorar**: Veja dados chegando em tempo real
4. **Escalar**: Adicione mais sensores conforme necessário

---

## 🌟 RESULTADO ESPERADO

```
Sistema Distribuído Real que:
✅ Roda 24/7 no Raspberry Pi
✅ Coleta dados de múltiplos ESP32
✅ Armazena em PostgreSQL
✅ Exibe em Dashboard web
✅ Nunca precisa do seu notebook!
```

---

## 📍 PRÓXIMA LEITURA

**Recomendação de ordem:**

1. **Este arquivo** (você já leu!) ✅
2. **QUICK_START_ONLINE.md** (3 passos) ← LER AGORA
3. **PLANO_EXECUCAO.md** (se tiver dúvidas)
4. **INDICE_MASTER.md** (referência futura)

---

## 🚀 VOCÊ ESTÁ PRONTO!

**Vá agora para:** [QUICK_START_ONLINE.md](QUICK_START_ONLINE.md)

Qualquer dúvida no caminho, consulte **PLANO_EXECUCAO.md** (seção 🆘).

**Boa sorte! 💪**

---

*Criado para: Sistema de Monitoramento IoT Distribuído*  
*Versão: 2.0 (100% Online no Raspberry Pi)*  
*Data: 2024*
