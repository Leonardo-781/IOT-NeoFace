# Notas de Apresentação - Etapa 1

**Data da Apresentação:** 11 de Maio de 2026  
**Duração:** 3-5 minutos  
**Formato:** Apresentação com demonstração ao vivo  

---

## 📋 Roteiro de Apresentação

### Slide 1: Introdução (30 segundos)
- "Olá, meu nome é Leonardo Cardoso"
- "Vou apresentar meu trabalho final de Sistemas Distribuídos"
- "Título: Painel IoT Distribuído com Monitoramento em Tempo Real"

### Slide 2: O que é o Projeto? (1 minuto)
- Apresente os componentes principais
- Mostre o fluxo básico: Sensores → Broker → Backend → Dashboard
- Explique: "É um sistema real que coleta dados de múltiplos sensores"

### Slide 3: Por que é Distribuído? (1 minuto)
- Destaque os 4 pontos principais:
  - Múltiplas máquinas (Notebook + Raspberry Pi 3)
  - Comunicação em rede via Tailscale
  - Múltiplos sensores em paralelo
  - Necessidade de sincronização
- Diga: "Temos 2 máquinas físicas conectadas por VPN segura"

### Slide 4: Arquitetura (1 minuto)
- Explique o diagrama
- Mostre a separação de responsabilidades
- Explique: "Backend roda no meu Notebook, BD no Raspberry Pi 3"
- Mostre os IPs Tailscale

### Slide 5-6: Metas e Tecnologias (1 minuto)
- Rápido overview dos badges (✓ Implementado, ⧗ Futuro)
- Liste as tecnologias principais
- Destaque: Node.js, PostgreSQL, MQTT, Tailscale

### Slide 7-9: Conceitos Técnicos (1 minuto)
- Mapeie conceitos teóricos para implementação prática
- Exemplo: "MQTT Broker = Message Queue"
- "PostgreSQL locks = Exclusão Mútua"

### Slide 10-11: Cronograma e Conclusão (30 segundos)
- Mostre as 8 etapas
- Diga: "Começamos com arquitetura, evoluímos para threads, sockets, RPC..."
- Conclua: "Um projeto didático e real ao mesmo tempo"

### Slide 12: Obrigado
- Convide para perguntas
- Ofereça demonstração ao vivo se houver interesse

---

## 🎤 Dicas de Apresentação

1. **Fale devagar e claro** - Deixe a audiência acompanhar
2. **Não leia slides** - Use como referência, fale com suas palavras
3. **Tempo:** Mantenha entre 3-5 minutos (máximo 7 com perguntas)
4. **Gestos:** Use apontador laser se disponível, ou mouse
5. **Contato visual:** Olhe para a audiência, não para a tela
6. **Entusiasmo:** Demonstre interesse no projeto

---

## 🎯 Pontos-chave para enfatizar

✅ **Já implementado:**
- 2 máquinas distribuídas (Notebook + Rasp Pi 3)
- Comunicação MQTT + HTTP
- Banco de dados remoto (PostgreSQL)
- Dashboard web funcional
- Acesso remoto seguro (Tailscale)
- Autenticação e papéis de usuário

⧗ **Futuro (próximas etapas):**
- Processamento paralelo com threads
- Replicação de BD
- Consensus e eleição de líder
- Observabilidade (Prometheus/Grafana)

---

## 📊 Demo ao Vivo (Opcional)

Se tiver tempo, mostre:

1. **Dashboard web** acessando em `https://serverl.taila7d06b.ts.net`
   - Demonstre login com diferentes usuários
   - Mostre dados em tempo real
   
2. **SSH remoto** via Tailscale
   ```bash
   ssh leo@serverl  # Ou ssh leo@server-sti
   ```
   
3. **MQTT Topics** publicando dados
   ```bash
   mosquitto_sub -h localhost -t "/telemetry/#"
   ```

4. **PostgreSQL remoto**
   ```bash
   psql -h 100.82.140.119 -U iot_user -d iot_monitoring
   SELECT * FROM telemetry LIMIT 5;
   ```

---

## ❓ Possíveis Perguntas e Respostas

**P: Como você garante escalabilidade se tiver 100+ sensores?**  
R: MQTT broker é feito para isso, TimescaleDB com hipertables, Node.js cluster mode para múltiplas instâncias.

**P: E se o Raspberry cair?**  
R: Backend detecta desconexão, tenta reconectar automaticamente. Com backup em outro Rasp, seria zero-downtime.

**P: Como você protege os dados?**  
R: Tailscale (VPN Zero-Trust), RBAC (papéis), Sessions HTTP, futura: TLS para MQTT.

**P: Qual a latência de ponta-a-ponta?**  
R: ~100-500ms do sensor para o dashboard (MQTT + HTTP + BD).

---

## 📝 Cheklist de Preparação

- [ ] Documento PDF pronto
- [ ] Apresentação HTML testada (cliques nos slides funcionam)
- [ ] Diagrama PlantUML gerado
- [ ] Computador com projetor funcionando
- [ ] Tailscale ativo (VPN conectada)
- [ ] Dashboard acessível remotamente
- [ ] Backup dos documentos em USB
- [ ] Tempo de apresentação cronometrado
- [ ] Voz clara e audível testada
- [ ] Perguntas preparadas para fazer de volta

---

**Boa sorte na apresentação! 🚀**

Leonardo Cardoso  
04 de Maio de 2026
