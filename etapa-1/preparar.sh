#!/bin/bash
# Script para preparar e gerar arquivos da Etapa 1

set -e  # Exit on error

echo "========================================"
echo "ETAPA 1: Preparação Completa"
echo "========================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar arquivos
echo -e "${BLUE}[1/4] Verificando arquivos...${NC}"
if [ -f "documentos/Etapa-1-Concepcao-Arquitetura.md" ]; then
    echo -e "${GREEN}✓ Documento Markdown encontrado${NC}"
else
    echo -e "${YELLOW}⚠ Documento Markdown não encontrado${NC}"
fi

# 2. Converter para PDF (se pandoc disponível)
echo ""
echo -e "${BLUE}[2/4] Convertendo para PDF...${NC}"
if command -v pandoc &> /dev/null; then
    echo "Pandoc detectado. Convertendo..."
    pandoc "documentos/Etapa-1-Concepcao-Arquitetura.md" \
           -o "documentos/Etapa-1-Concepcao-Arquitetura.pdf" \
           --from markdown --to pdf \
           --pdf-engine=xelatex \
           -V mainfont="DejaVuSans" \
           2>/dev/null && echo -e "${GREEN}✓ PDF gerado${NC}" || echo -e "${YELLOW}⚠ Erro na conversão${NC}"
else
    echo -e "${YELLOW}⚠ Pandoc não instalado. Pulando conversão PDF.${NC}"
    echo "  Instale com: sudo apt install pandoc (Linux) ou choco install pandoc (Windows)"
fi

# 3. Gerar diagrama PlantUML
echo ""
echo -e "${BLUE}[3/4] Verificando diagramas...${NC}"
if [ -f "diagramas/arquitetura.puml" ]; then
    echo -e "${GREEN}✓ Diagrama PlantUML encontrado${NC}"
    if command -v plantuml &> /dev/null; then
        echo "PlantUML detectado. Gerando PNG..."
        plantuml -Tpng diagramas/arquitetura.puml && echo -e "${GREEN}✓ PNG gerado${NC}"
    else
        echo -e "${YELLOW}⚠ PlantUML não instalado. Você pode gerar em: https://www.plantuml.com/plantuml/uml/${NC}"
    fi
fi

# 4. Verificar apresentação HTML
echo ""
echo -e "${BLUE}[4/4] Verificando apresentação...${NC}"
if [ -f "apresentacao/apresentacao-interativa.html" ]; then
    echo -e "${GREEN}✓ Apresentação HTML encontrada${NC}"
    echo "  Abra em navegador: open apresentacao/apresentacao-interativa.html"
fi

# Resumo
echo ""
echo "========================================"
echo -e "${GREEN}✓ PREPARAÇÃO CONCLUÍDA!${NC}"
echo "========================================"
echo ""
echo "📁 Arquivos gerados:"
echo "  - documentos/Etapa-1-Concepcao-Arquitetura.md"
echo "  - documentos/Etapa-1-Concepcao-Arquitetura.pdf (se pandoc)"
echo "  - apresentacao/apresentacao-interativa.html"
echo "  - diagramas/arquitetura.puml"
echo "  - notas/Notas-Apresentacao.md"
echo ""
echo "🎯 Próximos passos:"
echo "  1. Preencha sua matrícula no documento"
echo "  2. Abra a apresentação em navegador"
echo "  3. Teste os links Tailscale (serverl.taila7d06b.ts.net)"
echo "  4. Pratique a apresentação (3-5 minutos)"
echo ""
echo "📅 Apresentação: 11 de Maio de 2026"
echo ""
