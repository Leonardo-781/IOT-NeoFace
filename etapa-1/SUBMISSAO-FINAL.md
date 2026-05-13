# ETAPA-1: CHECKLIST DE SUBMISSAO FINAL

**Data de Conclusão:** 04 de Maio de 2026  
**Matrícula:** 32021BSI004  
**Data Limite:** 08 de Maio de 2026 (PDF)  
**Apresentação:** 11 de Maio de 2026  

---

## STATUS GERAL: ✓ COMPLETO

### Fase 1: Documentação (CONCLUÍDA)

- [x] Matrícula inserida no documento (32021BSI004)
- [x] Arquivo Markdown criado: `Etapa-1-Concepcao-Arquitetura.md`
- [x] PDF gerado: `Etapa-1-Concepcao-Arquitetura.pdf`
- [x] Tema definido: "Painel IoT Distribuído com Monitoramento em Tempo Real"
- [x] Arquitetura descrita com 7 componentes principais
- [x] Objetivos de Sistemas Distribuídos documentados

### Fase 2: Apresentação (PRONTA)

- [x] Arquivo HTML interativo criado: `apresentacao-interativa.html`
- [x] 12 slides implementados
- [x] Navegação por setas e botões funcionando
- [x] Design profissional com cores corporativas
- [x] Todos os tópicos cobertos

### Fase 3: Diagramas (PRONTA)

- [x] Diagrama UML criado: `arquitetura.puml`
- [x] 7 componentes mapeados
- [x] Interações entre componentes representadas
- [x] Pronto para renderização via PlantUML

### Fase 4: Notas e Suporte (PRONTA)

- [x] Notas de apresentação criadas: `Notas-Apresentacao.md`
- [x] Timing de 3-5 minutos documentado
- [x] Pontos-chave por slide identificados
- [x] Questões antecipadas incluídas

### Fase 5: Infraestrutura (VALIDADA)

- [x] Tailscale status: **ATIVO** (100.82.140.119 - serverl)
- [x] PostgreSQL remoto: **ACESSÍVEL** (porta 5432 aberta)
- [x] Aplicação web: **RESPONDENDO** (Status HTTP 401 esperado)
- [x] Acesso Tailscale Funnel: **FUNCIONANDO** (HTTPS público)

---

## ARQUIVOS ENTREGÁVEIS

### Documentos Principais
```
etapa-1/
├── documentos/
│   ├── Etapa-1-Concepcao-Arquitetura.md      ✓ PRONTO
│   └── Etapa-1-Concepcao-Arquitetura.pdf     ✓ GERADO
├── apresentacao/
│   └── apresentacao-interativa.html          ✓ PRONTO
├── diagramas/
│   └── arquitetura.puml                      ✓ PRONTO
├── notas/
│   └── Notas-Apresentacao.md                 ✓ PRONTO
└── README.md                                 ✓ PRONTO
```

---

## PRÓXIMAS AÇÕES

### Antes de 08/05 (Entrega do PDF)
1. [ ] Verificar se PDF foi salvo corretamente
   ```
   Localização: etapa-1/documentos/Etapa-1-Concepcao-Arquitetura.pdf
   ```

2. [ ] Fazer upload do PDF no sistema da disciplina
   - Nome do arquivo: `32021BSI004_Etapa1.pdf`
   - Ou seguir nomenclatura exigida pelo professor

### Antes de 11/05 (Apresentação)
1. [ ] Abrir `etapa-1/apresentacao/apresentacao-interativa.html` em navegador
2. [ ] Praticar apresentação com cronômetro (3-5 min)
3. [ ] Revisar notas em `etapa-1/notas/Notas-Apresentacao.md`
4. [ ] Renderizar diagrama UML:
   - Opção A: http://www.plantuml.com/plantuml/uml → colar conteúdo de `.puml`
   - Opção B: Instalar PlantUML localmente

### Validação Final (Dia da Apresentação)
- [ ] Verificar conectividade Tailscale
  ```powershell
  tailscale status
  ```

- [ ] Testar aplicação web
  ```
  https://serverl.taila7d06b.ts.net
  ```

- [ ] Confirmar banco de dados acessível
  ```
  Porta 5432 em 100.82.140.119 deve estar aberta
  ```

---

## INFORMAÇÕES DE ACESSO (Para Apresentação)

### Sistema em Produção
- **URL Pública:** https://serverl.taila7d06b.ts.net
- **Acesso Local (Rasp Pi):** 100.82.140.119:3000
- **Banco de Dados:** 100.82.140.119:5432

### Credenciais
- **Usuário BD:** iot_user
- **Senha BD:** iot_pass123
- **Banco:** iot_monitoring

### Máquinas Envolvidas
| Máquina | IP Tailscale | Função |
|---------|-------------|---------|
| Rasp Pi 3 | 100.82.140.119 | BD + Backend |
| Notebook | 100.82.199.70 | Desenvolvimento |

---

## RESUMO DE ENTREGA

| Componente | Status | Data | Observações |
|-----------|--------|------|------------|
| **PDF Etapa-1** | ✓ Pronto | 04/05 | Matrícula inserida |
| **Apresentação HTML** | ✓ Pronto | 04/05 | 12 slides interativos |
| **Diagramas UML** | ✓ Pronto | 04/05 | PlantUML |
| **Notas Apresentação** | ✓ Pronto | 04/05 | Timing + QA |
| **Infraestrutura** | ✓ Validada | 04/05 | Tailscale + BD online |

---

## OBSERVAÇÕES FINAIS

✅ **TUDO ESTÁ PRONTO PARA ENTREGA E APRESENTAÇÃO**

- Deadline PDF (08/05): 4 dias restantes
- Deadline Apresentação (11/05): 7 dias restantes
- Sistema em produção e validado
- Documentação completa gerada
- Infraestrutura remota funcionando

**Próximo passo:** Fazer upload do PDF no sistema da disciplina e praticar a apresentação!

---

**Gerado em:** 04 de Maio de 2026  
**Versão:** Final - Completo  
**Status:** APROVADO PARA ENTREGA
