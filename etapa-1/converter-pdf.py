#!/usr/bin/env python3
"""
Script para converter Markdown para PDF
Instale antes: pip install markdown2 reportlab
"""

import sys
import os

def convert_md_to_pdf():
    """Converte o documento Markdown em PDF"""
    
    # Opção 1: Usando pandoc (mais completo)
    print("=" * 60)
    print("CONVERSOR: Markdown → PDF")
    print("=" * 60)
    print()
    
    input_file = "documentos/Etapa-1-Concepcao-Arquitetura.md"
    output_file = "documentos/Etapa-1-Concepcao-Arquitetura.pdf"
    
    print(f"📄 Arquivo de entrada: {input_file}")
    print(f"📋 Arquivo de saída: {output_file}")
    print()
    
    # Verificar se pandoc está instalado
    check_pandoc = os.system("pandoc --version > /dev/null 2>&1")
    
    if check_pandoc == 0:
        print("✓ Pandoc detectado. Convertendo...")
        cmd = f'pandoc "{input_file}" -o "{output_file}" --from markdown --to pdf --pdf-engine=xelatex'
        result = os.system(cmd)
        if result == 0:
            print(f"✅ PDF gerado com sucesso: {output_file}")
        else:
            print("❌ Erro na conversão com pandoc")
    else:
        print("⚠️  Pandoc não encontrado. Instalando alternativa...")
        print()
        print("Opções:")
        print("1. Instale pandoc:")
        print("   Windows: choco install pandoc")
        print("   Linux: sudo apt install pandoc")
        print("   macOS: brew install pandoc")
        print()
        print("2. Ou use online:")
        print("   https://pandoc.org/try/")
        print()
        print("3. Ou exporte do Google Docs/Word como PDF")

if __name__ == "__main__":
    convert_md_to_pdf()
