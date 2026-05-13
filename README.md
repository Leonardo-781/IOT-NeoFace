# Trabalho Final - Painel IoT

Aplicacao web distribuida para o trabalho final de Sistemas Distribuidos, com foco em monitoramento IoT com backend dividido em duas maquinas.

## O que esta incluido

- dashboard em tempo real
- simulacao de telemetria de nodes ESP32
- alertas automatizados
- envio de comandos com ACK
- login por usuario e senha com sessao local
- cadastro de usuarios com papeis admin, operator e viewer
- cadastro de novos ESP (inventario de dispositivos)
- configuracao de banco de dados no painel admin
- API HTTP local
- persistencia em arquivo JSON para o prototipo
- firmware ESP32 para node sensor e gateway em [esp32/](esp32)
- separacao entre API gateway e backend de tratamento/broker/interface

## Arquitetura Distribuida

### Topologia

- **Raspberry Pi 3**: PostgreSQL/TimescaleDB (banco de dados remoto)
- **Notebook STI**: backend, API gateway, broker MQTT e interface web
- **Acesso HTTP**: Nginx como reverse proxy para a interface web e a API

```
┌─────────────────────────────┐
│  Notebook STI               │
│  ┌──────────────────────┐   │
│  │ Backend server.js    │   │
│  │ :3000 (UI + API)     │   │
│  ├──────────────────────┤   │
│  │ API Gateway api.js   │   │
│  │ :3001 (proxy)        │   │
│  ├──────────────────────┤   │
│  │ Broker broker.js     │   │
│  │ :1883 (MQTT)         │   │
│  └──────────────────────┘   │
│           │                 │
│  ┌────────┴──────────┐      │
│  │ pm2 (supervisao)  │      │
│  └───────────────────┘      │
└──────────┬────────────────────┘
           │ TCP :5432 (rede local ou IP direto do Raspberry)
           ▼
┌─────────────────────────────┐
│  Raspberry Pi 3             │
│  ┌──────────────────────┐   │
│  │ PostgreSQL + TS DB   │   │
│  │ :5432 (iot_monitoring│   │
│  └──────────────────────┘   │
└─────────────────────────────┘
```

## Como executar

### Inicio Rapido (STI)

1. Instale o Node.js 18 ou superior.
2. Abra esta pasta no terminal.
4. Certifique-se de que [data/system_config.json](data/system_config.json) aponta para o Raspberry:
   - `host`: IP do Raspberry na rede local ou endereço acessível a partir do notebook
   - `port`: `5432`
4. Instale dependencias e suba todos os servicos:

```bash
npm install
npm install -g pm2
pm2 start deploy/ecosystem.config.js --env production
pm2 save
pm2 startup
```

5. Acesse:

```text
http://localhost:3000
```

6. Entre com o login padrao:

```text
usuario: admin
senha: 123456
```

7. Visualize logs em tempo real:

```bash
pm2 logs
```

### Gerenciar servicos com pm2

```bash
pm2 status                    # Ver status dos servicos
pm2 logs tf-server            # Ver logs do backend
pm2 logs tf-api               # Ver logs do gateway
pm2 logs tf-broker            # Ver logs do broker
pm2 restart all               # Reiniciar todos
pm2 stop all                  # Parar todos
pm2 delete all                # Remover todos
```

### Modo Development

Para desenvolvimento sem pm2, suba em terminais separados:

```bash
# Terminal 1: Backend
npm start

# Terminal 2: API Gateway
npm run api

# Terminal 3: Broker MQTT
npm run broker
```

### Maquina 1: Raspberry Pi (Banco de Dados)

O banco ja deve estar rodando como servico no Raspberry Pi. Verifique com:

```bash
ssh leo@IP_DO_RASP sudo systemctl status postgresql
```

Se nao estiver instalado, rode em um terminal no STI:

```bash
ssh leo@IP_DO_RASP 'sudo bash -c "apt-get install -y postgresql postgresql-contrib"'
```

## Variaveis de ambiente

- `PORT`: porta do servidor, padrao `3000`
- `SIMULATION_INTERVAL_MS`: intervalo de simulacao da telemetria, padrao `5000`
- `COMMAND_ACK_DELAY_MS`: atraso do ACK de comando, padrao `1200`
- `MAX_TELEMETRY_POINTS`: quantidade maxima de pontos mantidos em memoria, padrao `120`
- `BACKEND_URL`: endereco da maquina 2 usado pela API gateway, padrao `http://localhost:3000`
- `LOGIN_USER`: usuario do login, padrao `admin`
- `LOGIN_PASSWORD`: senha do login, padrao `123456`

## Perfis de acesso

- `admin`: cadastra usuarios, altera papéis, executa comandos e usa tudo do sistema
- `operator`: visualiza o painel e envia comandos, mas não gerencia usuarios
- `viewer`: apenas visualiza dados e alertas

## Acesso com Nginx

O projeto ja inclui configuracao de Nginx em [deploy/nginx/](deploy/nginx). A ideia e usar o Nginx como entrada unica para a interface e para a API.

### No notebook ou servidor que hospeda a aplicacao

1. Instale o Nginx.
2. Copie [deploy/nginx/server-sti-nginx.conf](deploy/nginx/server-sti-nginx.conf) para `/etc/nginx/sites-available/server-sti`.
3. Habilite o site e recarregue o Nginx.

```bash
sudo apt install -y nginx
sudo cp deploy/nginx/server-sti-nginx.conf /etc/nginx/sites-available/server-sti
sudo ln -s /etc/nginx/sites-available/server-sti /etc/nginx/sites-enabled/server-sti
sudo nginx -t
sudo systemctl reload nginx
```

4. Acesse a aplicacao pelo IP ou dominio configurado em `server_name`.
   - Exemplo atual: `192.168.1.16`

## Deploy em VPS com Docker Compose

Esta e a opcao mais rapida para hospedar tudo em um unico servidor Linux: backend, gateway HTTP, ingest MQTT, Postgres e broker MQTT.

### O que sobe

- `db`: PostgreSQL 16 com volume persistente
- `mqtt`: Mosquitto para os ESPs publicarem telemetria
- `backend`: `server.js`, com UI e persistencia
- `gateway`: `api-server.js`, para manter compatibilidade com `POST /api/ingest`
- `ingest`: `ingest-service.js`, para receber telemetria direto do MQTT e salvar no banco

### Passo a passo

1. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

2. Ajuste as senhas e portas no `.env` se quiser.

3. Suba a stack:

```bash
docker compose up -d --build
```

4. Confira os logs:

```bash
docker compose logs -f backend gateway ingest db mqtt
```

5. Acesse:

```text
http://IP_DO_VPS:3000
http://IP_DO_VPS:3001/api/health
```

### Observacoes

- O MQTT fica aberto na porta `1883`. Em VPS publica, use firewall e, se possivel, autenticacao/TLS depois.
- Se voce quiser usar apenas HTTP, o `gateway` ja resolve o `POST /api/ingest`.
- Se os ESPs publicarem MQTT, mantenha o servico `ingest` ativo.

## Endpoints principais

- `GET /api/health`
- `GET /api/summary`
- `GET /api/nodes`
- `GET /api/telemetry?nodeId=NODE07&limit=30`
- `GET /api/alerts?openOnly=1`
- `GET /api/commands`
- `POST /api/commands`
- `POST /api/ingest`
- `GET /api/events`
- `GET /api/esp`
- `POST /api/esp` (admin)
- `PATCH /api/esp/:nodeId` (admin)
- `DELETE /api/esp/:nodeId` (admin)
- `GET /api/db-config` (admin)
- `PUT /api/db-config` (admin)


