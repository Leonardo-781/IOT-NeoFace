#!/usr/bin/env python3
"""
Gerador de PDF para Etapa-1
Converte Markdown para PDF com formatação profissional
"""

import os
import sys
from pathlib import Path
import markdown2
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from datetime import datetime

def md_to_pdf(md_path, pdf_path):
    """Converte Markdown para PDF com formatação"""
    
    # Verificar arquivo de entrada
    if not os.path.exists(md_path):
        print(f"❌ Arquivo não encontrado: {md_path}")
        return False
    
    try:
        # Ler arquivo Markdown
        with open(md_path, 'r', encoding='utf-8') as f:
            md_content = f.read()
        
        # Converter Markdown para HTML
        html_content = markdown2.markdown(md_content, extras=['tables', 'fenced-code-blocks', 'breaks'])
        
        # Criar documento PDF
        doc = SimpleDocTemplate(pdf_path, pagesize=A4, topMargin=0.75*inch, bottomMargin=0.75*inch)
        styles = getSampleStyleSheet()
        
        # Estilos customizados
        styles.add(ParagraphStyle(name='CustomHeading1', parent=styles['Heading1'],
                                 fontSize=18, textColor=colors.HexColor('#1f4788'),
                                 spaceAfter=12, spaceBefore=12, borderPadding=6))
        styles.add(ParagraphStyle(name='CustomHeading2', parent=styles['Heading2'],
                                 fontSize=14, textColor=colors.HexColor('#2e5090'),
                                 spaceAfter=10, spaceBefore=10))
        styles.add(ParagraphStyle(name='BodyText', parent=styles['BodyText'],
                                 fontSize=11, alignment=TA_JUSTIFY, spaceAfter=8))
        styles.add(ParagraphStyle(name='CustomTitle', parent=styles['Heading1'],
                                 fontSize=20, textColor=colors.HexColor('#000080'),
                                 alignment=TA_CENTER, spaceAfter=6, spaceBefore=0))
        
        # Elementos do PDF
        elements = []
        
        # Processar conteúdo HTML de forma simplificada
        lines = html_content.split('\n')
        for line in lines:
            line = line.strip()
            
            if not line:
                elements.append(Spacer(1, 0.1*inch))
                continue
            
            # Remover tags HTML básicas
            if line.startswith('<h1>'):
                text = line.replace('<h1>', '').replace('</h1>', '')
                elements.append(Paragraph(text, styles['CustomTitle']))
                elements.append(Spacer(1, 0.2*inch))
            elif line.startswith('<h2>'):
                text = line.replace('<h2>', '').replace('</h2>', '')
                elements.append(Paragraph(text, styles['CustomHeading1']))
                elements.append(Spacer(1, 0.15*inch))
            elif line.startswith('<h3>'):
                text = line.replace('<h3>', '').replace('</h3>', '')
                elements.append(Paragraph(text, styles['CustomHeading2']))
                elements.append(Spacer(1, 0.1*inch))
            elif line.startswith('<p>'):
                text = line.replace('<p>', '').replace('</p>', '')
                # Remover mais HTML tags comuns
                text = text.replace('<strong>', '<b>').replace('</strong>', '</b>')
                text = text.replace('<em>', '<i>').replace('</em>', '</i>')
                text = text.replace('<code>', '<font face="Courier">').replace('</code>', '</font>')
                elements.append(Paragraph(text, styles['BodyText']))
            elif line.startswith('<ul>') or line.startswith('</ul>'):
                continue
            elif line.startswith('<li>'):
                text = line.replace('<li>', '• ').replace('</li>', '')
                elements.append(Paragraph(text, styles['BodyText']))
            elif line.startswith('<ol>') or line.startswith('</ol>'):
                continue
            elif line.startswith('<table>') or line.startswith('</table>') or \
                 line.startswith('<thead>') or line.startswith('</thead>') or \
                 line.startswith('<tbody>') or line.startswith('</tbody>') or \
                 line.startswith('<tr>') or line.startswith('</tr>') or \
                 line.startswith('<th>') or line.startswith('</th>') or \
                 line.startswith('<td>') or line.startswith('</td>'):
                # Ignorar tabelas por enquanto
                continue
            elif line.startswith('<hr'):
                elements.append(Spacer(1, 0.15*inch))
            else:
                if line and not line.startswith('<'):
                    elements.append(Paragraph(line, styles['BodyText']))
        
        # Gerar PDF
        doc.build(elements)
        print(f"✅ PDF gerado com sucesso: {pdf_path}")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao gerar PDF: {e}")
        return False

if __name__ == '__main__':
    # Caminhos
    base_dir = Path(__file__).parent
    md_file = base_dir / 'etapa-1' / 'documentos' / 'Etapa-1-Concepcao-Arquitetura.md'
    pdf_file = base_dir / 'etapa-1' / 'documentos' / 'Etapa-1-Concepcao-Arquitetura.pdf'
    
    print("=" * 60)
    print("🔄 Conversor: Markdown → PDF")
    print("=" * 60)
    print(f"📄 Entrada: {md_file}")
    print(f"📋 Saída:   {pdf_file}")
    print()
    
    if md_to_pdf(str(md_file), str(pdf_file)):
        print("\n✅ Processo concluído com sucesso!")
        sys.exit(0)
    else:
        print("\n❌ Falha na conversão")
        sys.exit(1)
