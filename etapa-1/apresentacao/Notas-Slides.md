Notas do Orador - Apresentação Etapa 1

Slide 1 - Capa:
- Cumprimentar a banca
- Dizer nome, matrícula e título do projeto
- Objetivo do trabalho em 1 frase

Slide 2 - Sumário:
- Dizer rapidamente os tópicos: visão geral, arquitetura, demo, conclusão

Slide 3 - Visão Geral:
- Explicar motivação: IoT cresce, necessidade de monitoramento simples e escalável
- Mostrar casos de uso (ambientes industriais, agricultura)

Slide 4 - Arquitetura:
- Explicar separação de responsabilidades: sensors, broker, API, backend, BD
- Destacar uso de Tailscale para acesso remoto sem port-forward

Slide 5 - Diagrama:
- Orientar a leitura do diagrama (esquerda: sensores; centro: broker/backend; direita: BD)
- Referir IPs Tailscale apenas se necessário

Slide 6 - Componentes:
- Falar de cada componente em 1 linha (ESP32, Mosquitto, API, Backend, BD)

Slide 7 - ESP32:
- Mostrar payload JSON de exemplo e explicar campos principais

Slide 8 - Mosquitto:
- Explicar QoS e porque foi escolhido

Slide 9 - Backend e BD:
- Falar sobre TimescaleDB e hypertables
- Mencionar índices e retenção de dados

Slide 10 - Fluxos:
- Percorrer telemetria e comando rapidamente

Slide 11 - Demo:
- Passos: tailscale status -> open dashboard -> show live readings -> send command
- Dica: abra as ferramentas do navegador para mostrar WebSocket/Network se necessário

Slide 12 - Conclusão:
- Reiterar objetivos atingidos
- Próximas etapas e agradecimentos


Dicas gerais:
- Pratique com cronômetro (3-5min)
- Tenha PDF e HTML local salvo
- Se algo falhar no demo, explique o que seria mostrado e mostre logs/screenshots
