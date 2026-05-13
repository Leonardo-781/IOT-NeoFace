# ETAPA 1 - Checklist Completo

## 📋 Documento Principal

- [x] **Etapa-1-Concepcao-Arquitetura.md**
  - ✅ Nome, matrícula, data
  - ✅ Descrição detalhada do tema
  - ✅ 5 metas de sistemas distribuídos
  - ✅ Diagrama ASCII da arquitetura
  - ✅ Descrição de 7 componentes
  - ✅ Fluxo de dados
  - ✅ Mapeamento de conceitos
  - ✅ Tecnologias utilizadas
  - ✅ Cronograma das 8 etapas

### Converter para PDF

**Windows PowerShell:**
```powershell
# Instalar pandoc (ou usar choco)
pandoc "documentos/Etapa-1-Concepcao-Arquitetura.md" `
  -o "documentos/Etapa-1-Concepcao-Arquitetura.pdf" `
  --from markdown --to pdf
```

**Linux/macOS:**
```bash
pandoc documentos/Etapa-1-Concepcao-Arquitetura.md \
  -o documentos/Etapa-1-Concepcao-Arquitetura.pdf \
  --from markdown --to pdf \
  --pdf-engine=xelatex
```

**Alternativa Online:**
- https://pandoc.org/try/ (upload do .md)

---

## 🎤 Apresentação Interativa

- [x] **apresentacao-interativa.html**
  - ✅ 12 slides completos
  - ✅ Navegação com setas (← → ou cliques)
  - ✅ Contadores de slide
  - ✅ Design profissional (gradiente purpura)
  - ✅ Responsivo e funciona offline
  - ✅ Impressão em PDF suportada

### Como usar:
1. Abra `apresentacao/apresentacao-interativa.html` em navegador
2. Use setas para navegar
3. Imprima como PDF (Ctrl+P → Salvar como PDF)

---

## 📊 Diagramas

- [x] **arquitetura.puml**
  - ✅ Diagrama UML em PlantUML
  - ✅ Componentes e conexões
  - ✅ Pacotes por função

### Gerar imagem:
```bash
# Online: https://www.plantuml.com/plantuml/uml/
# Ou instale: sudo apt install plantuml
plantuml -Tpng diagramas/arquitetura.puml
```

---

## 📝 Notas de Apresentação

- [x] **Notas-Apresentacao.md**
  - ✅ Roteiro slide-a-slide
  - ✅ Timing (3-5 minutos)
  - ✅ Dicas de apresentação
  - ✅ Demo ao vivo (opcional)
  - ✅ Possíveis perguntas e respostas
  - ✅ Checklist de preparação

### Estudar:
- Leia completamente antes da apresentação
- Pratique o timing
- Prepare respostas para perguntas

---

## 🛠️ Scripts de Preparação

- [x] **preparar.sh** (Linux/macOS)
  - Automatiza verificação de arquivos
  - Tenta gerar PDF (se pandoc)
  - Gera diagramas (se plantuml)

- [x] **preparar.bat** (Windows)
  - Instruções para Windows
  - Opções de conversão

### Executar:
```bash
# Linux/macOS
chmod +x preparar.sh
./preparar.sh

# Windows (PowerShell)
.\preparar.bat
```

---

## 📅 Cronograma

| Data | Etapa | Item | Status |
|------|-------|------|--------|
| **04/05** | 1 | Documentos criados | ✅ |
| **08/05** | 1 | **ENTREGA** | 📋 |
| **11/05** | 1 | **APRESENTAÇÃO** | 🎤 |
| **15/05** | 2 | Processos/Threads | ⏳ |
| 22/05 | 3 | Sockets | ⏳ |
| 29/05 | 4 | RPC | ⏳ |
| 05/06 | 5 | Message Queues | ⏳ |
| 12/06 | 6 | Sincronização | ⏳ |
| 19/06 | 7 | Tolerância a Falhas | ⏳ |
| 26/06 | 8 | Apresentação Final | 🎓 |

---

## 📦 Estrutura de Pastas

```
etapa-1/
├── README.md                              ← Você está aqui
├── CHECKLIST-COMPLETO.md                 ← Este arquivo
├── preparar.sh                            ← Script Linux/macOS
├── preparar.bat                           ← Script Windows
│
├── documentos/
│   ├── Etapa-1-Concepcao-Arquitetura.md   ✅ PRINCIPAL
│   └── Etapa-1-Concepcao-Arquitetura.pdf  (gerar)
│
├── apresentacao/
│   ├── apresentacao-interativa.html       ✅ 12 SLIDES
│   └── [slides.pptx]                      (opcional)
│
├── diagramas/
│   ├── arquitetura.puml                   ✅ UML
│   ├── arquitetura.png                    (gerar)
│   └── [diagrama-detalhado.svg]           (futuro)
│
└── notas/
    └── Notas-Apresentacao.md              ✅ ROTEIRO

```

---

## ✅ Checklist Final de Entrega

- [ ] Documento MD preenchido completamente
- [ ] Matrícula adicionada
- [ ] PDF gerado e salvo
- [ ] Apresentação HTML testada
- [ ] Links Tailscale verificados
- [ ] Diagramas gerados
- [ ] Notas de apresentação lidas
- [ ] Timing da apresentação testado (3-5 min)
- [ ] Cópias salvas em 2 locais (PC + USB)
- [ ] Enviado antes do prazo (08/05)

---

## 🎯 Dia da Apresentação (11/05)

### Preparação (30 min antes)
- [ ] Verificar projetor/monitor
- [ ] Abrir apresentação em navegador (full screen)
- [ ] Testar Tailscale (VPN ativa)
- [ ] Testar som/microfone
- [ ] Ter PDF impresso como backup

### Durante
- [ ] Falar devagar e claro
- [ ] Fazer contato visual
- [ ] 3-5 minutos máximo
- [ ] Estar pronto para perguntas

### Após
- [ ] Agradecer
- [ ] Oferecer demo ao vivo (opcional)
- [ ] Anotar feedback

---

## 📞 Contato para Dúvidas

**Arquivo:** Este documento  
**Atualização:** 04 de Maio de 2026  
**Status:** ✅ COMPLETO E PRONTO PARA ENTREGA

---

**Sucesso na apresentação! 🚀**
