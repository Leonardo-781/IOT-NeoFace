# Trabalho Final - Etapa 1: Concepção e Arquitetura Inicial

## Informações Gerais

- **Nome do Aluno:** Leonardo Cardoso
- **Matrícula:** [Sua Matrícula]
- **Disciplina:** Sistemas Distribuídos
- **Data de Entrega:** 08 de Maio de 2026
- **Título do Projeto:** Painel IoT Distribuído com Monitoramento em Tempo Real e Replicação de Dados

---

## 1. Definição do Tema do Micro-Mundo

### Descrição Geral

Desenvolvimento de um **sistema de monitoramento IoT distribuído** que simula um cenário real onde múltiplos sensores (dispositivos ESP32) distribuídos geograficamente coletam dados de temperatura, umidade e gás, transmitem para um servidor central através de um broker MQTT, e disponibilizam visualização em tempo real através de uma interface web.

### O que o Sistema Faz

1. **Coleta de Dados:** Múltiplos dispositivos ESP32 funcionam como nodes sensoriais, capturando leituras de BMP280 (temperatura/pressão) e MQ-7 (gás).
2. **Transmissão:** Dados são publicados via MQTT para um broker centralizado.
3. **Processamento:** Backend processa telemetria, aplica filtros, calcula alertas e persiste em banco de dados.
4. **Visualização:** Dashboard web exibe dados em tempo real, históricos, alertas e permite envio de comandos para os devices.
5. **Controle Descentralizado:** Sistema de usuários com papéis (admin, operator, viewer) controla acesso aos recursos.

### Entidades Principais

- **ESP32 Nodes:** Sensores distribuídos que medem o ambiente
- **Gateway IoT:** Dispositivo que recebe dados dos nodes e os envia para o servidor
- **API Gateway:** Camada de abstração HTTP para o backend
- **Backend:** Processa telemetria, gerencia BD e lógica de negócio
- **Broker MQTT:** Coordena comunicação entre devices e backend
- **PostgreSQL/TimescaleDB:** Armazena séries temporais de dados
- **Dashboard Web:** Interface de usuário para visualização e controle

### Por que é Distribuído

- Componentes rodam em máquinas diferentes (Raspberry Pi 3 para BD, Notebook para Web)
- Comunicação via rede (MQTT TCP/IP, HTTP)
- Múltiplos sensores (possibilidade de escala)
- Necessidade de sincronização de estado
- Tolerância a falhas (falha de um sensor não derruba o sistema)

---

## 2. Metas de Sistemas Distribuídos

### Escalabilidade ✓
- **Implementada:** Sistema pode receber múltiplos ESP32 nodes em paralelo
- **Futura:** Replicação de broker MQTT, particionamento de dados por localização geográfica
- **Métrica:** Suporta 100+ sensores simultâneos com latência < 5 segundos

### Disponibilidade ✓
- **Implementada:** Backend redunda entre 2 máquinas, persistência em BD
- **Futura:** Replicação de BD em múltiplas zonas, failover automático
- **Métrica:** RTO (Recovery Time Objective) < 1 minuto

### Tolerância a Falhas ✓
- **Implementada:** Serviços com restart automático, reconexão de clients MQTT
- **Futura:** Circuit breaker, retry com backoff exponencial, dead letter queue
- **Métrica:** Perda de mensagens < 0.1%

### Compartilhamento de Recursos ✓
- **Implementada:** BD centralizado, fila de comandos, estado compartilhado em memória
- **Futura:** Distributed locking, consensus para decisões críticas
- **Métrica:** Consistência eventual com latência < 500ms

### Segurança (Básico) ✓
- **Implementada:** Autenticação por sessão, papéis de acesso (RBAC)
- **Futura:** TLS para MQTT e HTTP, chaves SSH para acesso remoto, auditoria de logs
- **Métrica:** Zero exposição de credenciais em logs

---

## 3. Arquitetura Inicial

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         REDE LOCAL + TAILSCALE                   │
└─────────────────────────────────────────────────────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
         ┌──────▼──────┐  ┌──────▼──────┐  ┌─────▼──────┐
         │   ESP32      │  │   ESP32      │  │  Gateway   │
         │   Node 1     │  │   Node N     │  │   (ESP32)  │
         │ (192.168.1.x)│  │(192.168.1.x) │  │(192.168.1.y)│
         │ Temp/Humidity│  │ Temp/Humidity│  │  Sensores   │
         └──────┬──────┘  └──────┬───────┘  └─────┬──────┘
                │                │                │
                └────────────────┼────────────────┘
                          MQTT (TCP 1883)
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                                               │
    ┌────▼─────────┐                          ┌──────────▼──────┐
    │   Mosquitto   │                          │   API Gateway   │
    │   MQTT Broker │◄─────HTTP──────────────►│  (Node.js)      │
    │(Localhost:    │                          │ :3001 (Tunelado)│
    │  1883)        │                          │ Recebe telemetry│
    │               │                          │  POST /ingest   │
    └────┬─────────┘                          └──────────┬──────┘
         │                                               │
         │ TCP MQTT                                      │
         │                                               │
    ┌────▼──────────────────────────────────────────────▼─┐
    │                   Backend                            │
    │            (Node.js Server :3000)                    │
    │  ┌──────────────────────────────────────────────┐    │
    │  │ • Processa telemetria e alertas              │    │
    │  │ • Gerencia sessões e autenticação            │    │
    │  │ • Dashboard web (frontend)                   │    │
    │  │ • API REST para controle                     │    │
    │  │ • Simulação de sensores (fallback)           │    │
    │  └──────────────────────────────────────────────┘    │
    │                                                       │
    │  Máquina: Notebook (server-sti)                      │
    │  IP Local: 192.168.1.X                              │
    │  IP Tailscale: 100.82.199.70                        │
    └────────────────────┬─────────────────────────────────┘
                         │
                  TCP :5432 PostgreSQL
                         │
         ┌───────────────┴───────────────┐
         │                               │
    ┌────▼──────────────────────────┐    │
    │   PostgreSQL/TimescaleDB       │    │
    │   iot_monitoring (BD)          │    │
    │                                │    │
    │   Máquina: Raspberry Pi 3 (BD) │    │
    │   IP Local: 192.168.1.10       │    │
    │   IP Tailscale: 100.82.140.119 │    │
    └────────────────────────────────┘    │
                                          │
                              Replicação futura
```

---

## 4. Descrição dos Componentes

### 4.1 ESP32 Nodes (Sensores)

| Aspecto | Detalhe |
|--------|---------|
| **Responsabilidade** | Capturar leituras de sensores (BMP280: temp/pressão; MQ-7: gás); publicar via MQTT |
| **Tipo de Comunicação** | Publish/Subscribe MQTT (Mosquitto broker) |
| **Implementação** | Processo único (firmware Arduino/PlatformIO no ESP32) |
| **Protocolo** | MQTT TCP `:1883` |
| **Localização** | Distribuídos fisicamente (múltiplas localizações) |
| **Tolerância a Falhas** | Reconexão automática ao broker se houver desconexão |

### 4.2 Gateway IoT (ESP32 especial)

| Aspecto | Detalhe |
|--------|---------|
| **Responsabilidade** | Agregador de comandos; envia telemetria para backend via POST HTTP |
| **Tipo de Comunicação** | HTTP POST para `API Gateway :3001/api/ingest` |
| **Implementação** | Processo único (firmware Arduino) |
| **Protocolo** | HTTP/TCP `:3001` |
| **Endpoint** | POST `/api/ingest` |
| **Tolerância a Falhas** | Retry com buffer local de comandos não-enviados |

### 4.3 MQTT Broker (Mosquitto)

| Aspecto | Detalhe |
|--------|---------|
| **Responsabilidade** | Coordenar pub/sub entre ESP32 nodes e backend; garantir entrega de mensagens |
| **Tipo de Comunicação** | MQTT TCP (publish/subscribe) |
| **Implementação** | Serviço de sistema (pode ser processo independente ou container) |
| **Protocolo** | TCP `:1883` |
| **Localização** | Localhost (Notebook) |
| **Tópicos Principais** | `/telemetry/+/+` (dados), `/command/+` (comandos) |
| **Tolerância a Falhas** | Fila persistente de mensagens, reconnect automático |

### 4.4 API Gateway (Node.js)

| Aspecto | Detalhe |
|--------|---------|
| **Responsabilidade** | Receber telemetria do gateway IoT; validar e repassar ao backend |
| **Tipo de Comunicação** | HTTP (entrada), HTTP (saída ao backend) |
| **Implementação** | Process Node.js (`api-server.js`; Port `:3001`) |
| **Protocolo** | HTTP/TCP `:3001` |
| **Localização** | Notebook + Tunelado via Tailscale Funnel (acesso externo) |
| **Endpoints** | POST `/api/ingest`, GET `/api/status` |
| **Tolerância a Falhas** | Retry ao backend, health-check periódico |

### 4.5 Backend (Node.js)

| Aspecto | Detalhe |
|--------|---------|
| **Responsabilidade** | Processar telemetria, gerenciar BD, autenticação, lógica de negócio, UI web |
| **Tipo de Comunicação** | MQTT (sub), HTTP (API), PostgreSQL (Query) |
| **Implementação** | Process Node.js (`server.js`; Port `:3000`) |
| **Protocolo** | HTTP `:3000`, MQTT `:1883`, PostgreSQL `:5432` |
| **Localização** | Notebook (192.168.1.X) + Tailscale (100.82.199.70) |
| **Endpoints Principais** | GET `/`, POST `/login`, GET `/api/telemetry`, POST `/api/command` |
| **Módulos Internos** | postgres-store.js (BD), simple-broker-client.js (MQTT), iot-contract.js (domínio) |
| **Tolerância a Falhas** | Reconexão ao broker, fallback para simulação local de dados |

### 4.6 PostgreSQL/TimescaleDB (BD)

| Aspecto | Detalhe |
|--------|---------|
| **Responsabilidade** | Persistir série temporal de telemetria, config de devices, usuários e alertas |
| **Tipo de Comunicação** | SQL TCP `:5432` |
| **Implementação** | Serviço de sistema (PostgreSQL + TimescaleDB extension) |
| **Protocolo** | PostgreSQL TCP `:5432` |
| **Localização** | Raspberry Pi 3 (192.168.1.10) + Tailscale (100.82.140.119) |
| **Banco Principal** | `iot_monitoring` (user: `iot_user`) |
| **Tabelas Principais** | `telemetry` (hypertable), `devices`, `users`, `alerts` |
| **Tolerância a Falhas** | WAL (Write-Ahead Logging), backups programados, replicação futura |

### 4.7 Frontend Web (Dashboard)

| Aspecto | Detalhe |
|--------|---------|
| **Responsabilidade** | Exibir dados em tempo real, históricos, alertas; permitir controle de devices e usuários |
| **Tipo de Comunicação** | HTTP (requisições), WebSocket (real-time, futuro) |
| **Implementação** | HTML + JavaScript (SPA simples, `public/app.js`) |
| **Localização** | Servido pelo backend `:3000` |
| **Funcionalidades** | Login, dashboard, gráficos, controle de ESPs, gerenciamento de usuários (admin) |
| **Tolerância a Falhas** | Cache local, retry de requisições, feedback visual de erros |

---

## 5. Comunicação entre Componentes

### Fluxo de Dados - Telemetria

```
ESP32 Node 1 ─── MQTT Publish ──→ Mosquitto ─── Subscribe ──→ Backend
                                        ↓
                              API Gateway (GET)
                                    ↓
                              POST /api/ingest
                                    ↓
                              Backend processa
                                    ↓
                           PostgreSQL INSERT
```

### Fluxo de Dados - Comando

```
Dashboard Web ─── POST /api/command ──→ Backend
                                          ↓
                        Publish via MQTT ao tópico de comando
                                          ↓
                                    Mosquitto
                                          ↓
                        ESP32 subscrito em /command recebe
```

### Fluxo de Dados - Autenticação

```
Usuário ─── POST /login ──→ Backend (valida em memória)
                              ↓
                         Set sessão (cookie/token)
                              ↓
                   Redirecion para dashboard
```

---

## 6. Mapeamento de Conceitos de Sistemas Distribuídos

| Conceito | Implementação |
|----------|---------------|
| **Processos/Threads** | Node.js (event-loop single-thread, cluster para múltiplas instâncias) |
| **Sockets TCP/UDP** | MQTT (TCP), HTTP (TCP) |
| **RPC** | HTTP REST (futuro: gRPC) |
| **Message Queue** | MQTT broker (Mosquitto) |
| **Naming Service** | DNS + Tailscale MagicDNS (service discovery) |
| **Sincronização** | Shared state em memória + BD (eventual consistency) |
| **Exclusão Mútua** | PostgreSQL locks, transações ACID |
| **Replicação** | Futura: PostgreSQL replication + Mosquitto clustering |
| **Tolerância a Falhas** | Health-checks, auto-restart, reconexão |
| **Segurança** | RBAC (papéis), sessões, Tailscale (VPN) |

---

## 7. Tecnologias Utilizadas

- **Linguagem:** JavaScript (Node.js v18+)
- **BD:** PostgreSQL 16 + TimescaleDB (série temporal)
- **Broker:** Mosquitto (MQTT v3.1.1)
- **Firmware:** Arduino/PlatformIO (ESP32)
- **Frontend:** HTML5 + Vanilla JS
- **Acesso Remoto:** Tailscale (Zero-Trust VPN)
- **Deploy:** Docker Compose (futura) / Systemd (atual)

---

## 8. Próximas Etapas Previstas

1. **Etapa 2 - Processos/Threads:** Implementar thread pool para processamento paralelo de telemetria
2. **Etapa 3 - Sockets:** Otimizar comunicação MQTT com custom socket handlers
3. **Etapa 4 - RPC:** Migrar para gRPC para chamadas internas
4. **Etapa 5 - Message Queues:** Integrar RabbitMQ ou Apache Kafka para escalabilidade
5. **Etapa 6 - Sincronização:** Implementar consensus (Raft) para eleição de líder em replicação
6. **Etapa 7 - Tolerância a Falhas:** Circuit breakers, health-checks avançados, observabilidade (Prometheus/Grafana)

---

## 9. Cronograma

| Data | Etapa | Entrega |
|------|-------|---------|
| **08/05/2026** | 1 - Concepção e Arquitetura | ✓ Este documento |
| **15/05/2026** | 2 - Processos/Threads | Código + Relatório |
| **22/05/2026** | 3 - Sockets | Código + Relatório |
| **29/05/2026** | 4 - RPC | Código + Relatório |
| **05/06/2026** | 5 - Message Queues | Código + Relatório |
| **12/06/2026** | 6 - Sincronização | Código + Relatório |
| **19/06/2026** | 7 - Tolerância a Falhas | Código + Relatório |
| **26/06/2026** | 8 - Apresentação Final | Apresentação + Demo |

---

## 10. Conclusão

O projeto "Painel IoT Distribuído" é um sistema real e prático que ilustra os conceitos fundamentais de sistemas distribuídos. Começando com uma arquitetura de 2 camadas (BD + Web) conectadas via rede, o sistema evoluirá progressivamente para incluir components mais sofisticados de sincronização, replicação e tolerância a falhas.

A escolha por IoT permite explorar cenários reais onde:
- Múltiplos sensores (nós) são independentes e podem falhar
- Há necessidade de comunicação assíncrona e confiável
- Dados devem ser agregados e processados em tempo real
- Escalabilidade é uma preocupação real (escalar de 1 para 100+ sensores)

Com as ferramentas modernas (Node.js, PostgreSQL, MQTT, Tailscale), conseguimos demonstrar na prática como sistemas distribuídos reais são construídos.

---

**Assinado digitalmente por:** Leonardo Cardoso  
**Data:** 04 de Maio de 2026
