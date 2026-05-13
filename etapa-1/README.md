# Etapa 1 - Documentação e Organização

Pasta destinada a armazenar todos os materiais da **Etapa 1: Concepção e Arquitetura Inicial**.

## Estrutura de Pastas

```
etapa-1/
├── documentos/          # Documentos principais
│   └── Etapa-1-Concepcao-Arquitetura.md
├── diagramas/           # Diagramas (desenhos, screenshots, PlantUML)
│   └── [arquivos de diagrama]
├── apresentacao/        # Slides e materiais de apresentação (11/05/2026)
│   └── [slides.pptx ou similares]
├── notas/               # Notas, brainstorm, ideias
│   └── [notas.md]
└── README.md            # Este arquivo
```

## Entrega

- **Prazo:** 08 de Maio de 2026
- **Formato:** PDF (converter de Markdown ou usar Word/Google Docs)
- **Apresentação:** 11 de Maio de 2026 (3-5 minutos)

## Como Converter para PDF

### Opção 1: Pandoc (recomendado)
```bash
pandoc documentos/Etapa-1-Concepcao-Arquitetura.md -o documentos/Etapa-1-Concepcao-Arquitetura.pdf --from markdown --to pdf
```

### Opção 2: Google Docs
1. Copie o conteúdo do `.md`
2. Abra Google Docs
3. Cole o conteúdo
4. Format-te conforme necessário
5. Exporte como PDF

### Opção 3: VS Code + Markdown PDF Extension
1. Instale a extensão "Markdown PDF" no VS Code
2. Clique direito no arquivo `.md`
3. Selecione "Export (pdf)"

## Checklist de Entrega

- [ ] Documento com todas as seções preenchidas
- [ ] Matrícula e nome completo adicionados
- [ ] Diagrama claro e bem formatado
- [ ] Descrição de todos os 7 componentes
- [ ] PDF gerado e salvo na pasta
- [ ] Apresentação preparada para 11/05

## Próximas Etapas

- **Etapa 2 (15/05):** Processos e Threads
- **Etapa 3 (22/05):** Sockets
- **Etapa 4 (29/05):** RPC
- ... etc

---

**Última atualização:** 04 de Maio de 2026
