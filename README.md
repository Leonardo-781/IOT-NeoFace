# Trabalho Final - Painel IoT

Aplicacao web local para o trabalho final de Sistemas Distribuidos, com foco em monitoramento IoT com backend dividido em duas maquinas.

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
- separacao entre API gateway e backend de tratamento/banco/interface

## Como executar

### Maquina 2: backend, tratamento, banco e interface

1. Instale o Node.js 18 ou superior.
2. Abra esta pasta no terminal.
3. Execute:

```bash
npm start
```

4. Acesse:

```text
http://localhost:3000
```

5. Entre com o login padrao:

```text
usuario: admin
senha: 123456
```

6. No painel, o usuario admin pode:
	- cadastrar contas e alterar permissões
	- cadastrar, editar e remover ESPs
	- configurar os parametros do banco de dados (engine, host, porta, credenciais, retencao)

### Maquina 1: API gateway

1. Aponte `BACKEND_URL` para o endereco da maquina 2.
2. Execute:

```bash
npm run api
```

3. O gateway ESP32 deve postar em `http://IP_DA_MAQUINA_1:3001/api/ingest`.

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


