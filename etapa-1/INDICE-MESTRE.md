📚 **ÍNDICE MESTRE - ETAPA 1 COMPLETA**
=====================================

# Etapa 1: Concepção e Arquitetura Inicial
## Trabalho Final - Sistemas Distribuídos

**Aluno:** Leonardo Cardoso  
**Disciplina:** Sistemas Distribuídos  
**Entrega:** 08 de Maio de 2026  
**Apresentação:** 11 de Maio de 2026  

---

## 📦 O que foi criado?

### ✅ 1. Documento Principal (Entrega)
📄 **`documentos/Etapa-1-Concepcao-Arquitetura.md`**
- Documento completo em Markdown
- 10 seções principais
- Pronto para converter em PDF
- **Ação:** Preencha sua matrícula e converta para PDF

**Como converter para PDF:**
```powershell
# Windows PowerShell
pandoc "documentos/Etapa-1-Concepcao-Arquitetura.md" `
  -o "documentos/Etapa-1-Concepcao-Arquitetura.pdf" `
  --from markdown --to pdf
```

**Alternativas:**
- Google Docs: copie e cole o conteúdo, exporte como PDF
- Word: copie, formate, exporte como PDF
- Online: https://pandoc.org/try/

---

### 🎤 2. Apresentação Interativa (11 de Maio)
🖥️ **`apresentacao/apresentacao-interativa.html`**
- 12 slides profissionais
- Navegação com setas (← →) ou cliques
- Design moderno com gradiente
- Responsivo e funciona offline

**Como usar:**
```bash
# Windows
start apresentacao/apresentacao-interativa.html

# Linux/macOS
open apresentacao/apresentacao-interativa.html
```

**Recursos:**
- Botões: Anterior/Próximo
- Teclado: Setas esquerda/direita
- Impressão: Ctrl+P → Salvar como PDF

---

### 📊 3. Diagramas
📈 **`diagramas/arquitetura.puml`**
- Diagrama em PlantUML
- Mostra componentes e comunicação
- Pode gerar PNG/SVG

**Como usar:**
```bash
# Opção 1: Online em https://www.plantuml.com/plantuml/uml/
# Opção 2: Instalar plantuml
plantuml -Tpng diagramas/arquitetura.puml
# Gera: diagramas/arquitetura.png
```

---

### 📝 4. Notas de Apresentação
📋 **`notas/Notas-Apresentacao.md`**
- Roteiro completo slide-a-slide
- Timing de apresentação
- Dicas de fala
- Possíveis perguntas e respostas
- Demo ao vivo (opcional)

**Ação:** Leia completamente antes da apresentação

---

### 🛠️ 5. Checklists e Scripts
✅ **`CHECKLIST-COMPLETO.md`** - Checklist visual  
🔧 **`preparar.sh`** - Script Linux/macOS  
🔧 **`preparar.bat`** - Script Windows  
🐍 **`converter-pdf.py`** - Conversor Python

**Como usar:**
```bash
# Linux/macOS
chmod +x preparar.sh
./preparar.sh

# Windows (PowerShell)
.\preparar.bat
```

---

## 🎯 Passos para Entrega (Entrega: 08/05)

### 1️⃣ Preparar Documento (5 min)
```
[ ] Abra: documentos/Etapa-1-Concepcao-Arquitetura.md
[ ] Preencha sua matrícula em "Matrícula: [Sua Matrícula]"
[ ] Converta para PDF (siga opções acima)
[ ] Salve como: Etapa-1-Concepcao-Arquitetura.pdf
[ ] Verifique se PDF abriu corretamente
```

### 2️⃣ Testar Apresentação (5 min)
```
[ ] Abra: apresentacao/apresentacao-interativa.html
[ ] Teste navegação (setas e botões)
[ ] Veja todos os 12 slides
[ ] Teste impressão em PDF
```

### 3️⃣ Preparar Diagramas (5 min)
```
[ ] Gere PNG do diagrama (online ou local)
[ ] Salve em: diagramas/arquitetura.png
[ ] Verifique qualidade
```

### 4️⃣ Enviar Entrega
```
[ ] Comprima pasta etapa-1/
[ ] OU envie apenas: documentos/Etapa-1-Concepcao-Arquitetura.pdf
[ ] Verifique email de confirmação
[ ] Entregue antes das 23h59 do dia 08/05
```

---

## 🎤 Preparação para Apresentação (11/05)

### 1️⃣ Estudar (30 min antes)
```
[ ] Leia: notas/Notas-Apresentacao.md
[ ] Memorize os 12 slides
[ ] Pratique timing (3-5 minutos)
[ ] Teste respostas de possíveis perguntas
```

### 2️⃣ Setup Técnico (15 min antes)
```
[ ] Abra apresentacao/apresentacao-interativa.html em FULLSCREEN
[ ] Teste projetor/monitor
[ ] Verifique som e microfone
[ ] Prepare links Tailscale para demo
[ ] Tenha PDF impresso como backup
```

### 3️⃣ Apresentação (5 min no máximo)
```
[ ] Fale devagar e claro
[ ] Faça contato visual
[ ] Use apontador laser se possível
[ ] Não leia slides, fale com suas palavras
[ ] Deixe 1-2 min para perguntas
```

### 4️⃣ Demo Ao Vivo (Opcional)
```
[ ] Dashboard: https://serverl.taila7d06b.ts.net
[ ] SSH: ssh leo@serverl
[ ] PostgreSQL: psql -h serverl ...
[ ] Mostre dados em tempo real
```

---

## 📂 Estrutura Final de Pastas

```
etapa-1/
│
├── README.md                                    ← Guia geral
├── CHECKLIST-COMPLETO.md                       ← Checklist visual
├── INDICE-MESTRE.md                            ← Este arquivo
├── preparar.sh                                  ← Script Linux/macOS
├── preparar.bat                                 ← Script Windows
├── converter-pdf.py                             ← Conversor Python
│
├── documentos/                                  📋 ENTREGA
│   ├── Etapa-1-Concepcao-Arquitetura.md        ✅ PRINCIPAL
│   └── Etapa-1-Concepcao-Arquitetura.pdf       → GERAR
│
├── apresentacao/                                🎤 APRESENTAÇÃO
│   └── apresentacao-interativa.html            ✅ 12 SLIDES
│
├── diagramas/                                   📊 DIAGRAMAS
│   ├── arquitetura.puml                        ✅ UML
│   └── arquitetura.png                         → GERAR
│
└── notas/                                       📝 ROTEIRO
    └── Notas-Apresentacao.md                   ✅ COMPLETO

```

---

## 🔗 Links Importantes

**Apresentação:** 
- http://localhost:8000/apresentacao-interativa.html
- (abra localmente)

**Demo (Tailscale ativo):**
- Dashboard: https://serverl.taila7d06b.ts.net
- SSH: ssh leo@serverl
- PostgreSQL: psql -h serverl -U iot_user -d iot_monitoring

**Recursos Online:**
- Pandoc: https://pandoc.org/try/
- PlantUML: https://www.plantuml.com/plantuml/uml/
- GitHub: [seu repo aqui]

---

## 📅 Cronograma Completo

| Data | Etapa | Item | Status |
|------|-------|------|--------|
| 04/05 | 1 | Docs criados | ✅ |
| **08/05** | 1 | **ENTREGA FINAL** | 📋 |
| **11/05** | 1 | **APRESENTAÇÃO** | 🎤 |
| 15/05 | 2 | Processos/Threads | ⏳ |
| 22/05 | 3 | Sockets | ⏳ |
| 29/05 | 4 | RPC | ⏳ |
| 05/06 | 5 | Message Queues | ⏳ |
| 12/06 | 6 | Sincronização | ⏳ |
| 19/06 | 7 | Tolerância a Falhas | ⏳ |
| 26/06 | 8 | Apresentação Final | 🎓 |

---

## ❓ Perguntas Frequentes

**P: Como converter Markdown para PDF se não tiver Pandoc?**  
R: Use Google Docs, Word, ou https://pandoc.org/try/

**P: Posso editar a apresentação HTML?**  
R: Sim! Abra em VSCode, edite, e atualize as cores/conteúdo

**P: E se não conseguir apresentar ao vivo?**  
R: Envie PDF gravado + apresentação (com voz em narração)

**P: Quantas pessoas assistem à apresentação?**  
R: Geralmente 5-10 alunos + 1 professor (depende da disciplina)

**P: Preciso decorar os slides?**  
R: Não! Veja como referência, fale com suas palavras

---

## ✨ Dicas Finais

✅ **Faça:**
- Chegue 5 minutos mais cedo
- Tenha backup em pen-drive
- Fale com entusiasmo
- Tenha exemplos prontos
- Pratique a apresentação

❌ **Não faça:**
- Ler slides diretamente
- Virar as costas para audiência
- Falar muito rápido
- Usar muito "uhh" ou "ahn"
- Deixar para estudar na véspera

---

## 📞 Suporte

**Se tiver dúvidas:**
1. Releia este arquivo
2. Consulte as Notas-Apresentacao.md
3. Veja o CHECKLIST-COMPLETO.md
4. Execute preparar.sh ou preparar.bat
5. Teste tudo antes do dia 11/05

---

**ÚLTIMA ATUALIZAÇÃO:** 04 de Maio de 2026  
**VERSÃO:** 1.0 - Completa e Pronta  
**STATUS:** ✅ ETAPA 1 FINALIZADA

---

🚀 **BOA SORTE NA APRESENTAÇÃO!**

Leonardo Cardoso
