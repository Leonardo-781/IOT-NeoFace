# 🚀 Guia Rápido - Iniciar a Aplicação

## Topologia Distribuida

```
┌─────────────────────────────────┐
│  Notebook STI                   │
│  ├─ Backend (server.js) :3000   │
│  ├─ API Gateway (api.js) :3001  │
│  └─ Broker MQTT :1883           │
└──────────────┬──────────────────┘
               │ TCP :5432
               │ (rede local / IP direto)
               ▼
┌─────────────────────────────────┐
│  Raspberry Pi 3                 │
│  └─ PostgreSQL :5432            │
│     (IP do Raspberry)           │
└─────────────────────────────────┘
```

## Instalar pela primeira vez

```bash
# 1. Instalar dependências
npm install

# 2. Instalar pm2 globalmente
npm install -g pm2

# 3. Criar pasta de logs
mkdir -p logs

# 4. Subir os serviços
pm2 start deploy/ecosystem.config.js --env production
pm2 save
```

## Iniciar em uma máquina já configurada

```bash
# Opção 1: Com pm2 (recomendado - fica rodando em background)
pm2 start deploy/ecosystem.config.js

# Opção 2: Em terminais separados (para desenvolvimento)
# Terminal 1
npm start

# Terminal 2
npm run api

# Terminal 3
npm run broker
```

## Verificar status

```bash
# Ver todos os serviços
pm2 status

# Ver logs em tempo real
pm2 logs

# Ver logs de um serviço específico
pm2 logs tf-server
pm2 logs tf-api
pm2 logs tf-broker
```

## Parar/Reiniciar

```bash
# Parar tudo
pm2 stop all

# Reiniciar tudo
pm2 restart all

# Parar e remover
pm2 delete all
```

## Acessar a aplicação

- **UI Principal via Nginx**: http://192.168.1.16
- **UI Principal local**: http://localhost:3000
- **API Gateway local**: http://localhost:3001
- **Login padrão**: 
  - Usuário: `admin`
  - Senha: `123456`

## Verificar saúde

```bash
# Backend
curl http://localhost:3000/api/health

# Gateway
curl http://localhost:3001/

# Broker
curl http://localhost:1884/health
```

## Configurar o banco de dados

Acesse http://localhost:3000/painel, clique em "Configuração" (ícone de engrenagem) e edite:

- **Host**: IP do Raspberry na rede local ou endereço direto acessível pelo notebook
- **Port**: `5432`
- **Database**: `iot_monitoring`
- **User**: `iot_user`
- **Password**: `iot_pass123`

> Nota: A configuração é carregada de `data/system_config.json`

## Troubleshooting

### "Address already in use"
```bash
# Mata pm2 e libera as portas
pm2 kill
pm2 start deploy/ecosystem.config.js
```

### PostgreSQL não conecta
```bash
# Verifica se o Raspberry está online
ping IP_DO_RASP

# Verifica a porta do Postgres
Test-NetConnection IP_DO_RASP -Port 5432
```

### Ver logs de erro
```bash
pm2 logs tf-server --lines 100
```

## Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `pm2 monit` | Monitor em tempo real (CPU, memória) |
| `pm2 save` | Salva configuração para reinicializar no boot |
| `pm2 flush` | Limpa todos os logs |
| `pm2 describe tf-server` | Detalhes de um processo específico |

