# Como Usar o Arquivo LaTeX no Overleaf

## 📋 Resumo

Foi criado um arquivo `Etapa-1-LaTeX.tex` profissional e completo que pode ser compilado em LaTeX. Este arquivo gera um PDF de alta qualidade com toda a documentação da Etapa 1.

---

## 🚀 Opção 1: Usar no Overleaf (Recomendado)

### Passo 1: Criar Novo Projeto no Overleaf
1. Acesse https://www.overleaf.com/
2. Clique em **"New Project"** → **"Blank Project"**
3. Escolha um nome, ex: `Trabalho-Final-Etapa1-32021BSI004`

### Passo 2: Copiar Conteúdo do Arquivo LaTeX
1. Abra o arquivo: `etapa-1/documentos/Etapa-1-LaTeX.tex`
2. Copie **TODO** o conteúdo (Ctrl+A, Ctrl+C)
3. No Overleaf, substitua o conteúdo padrão de `main.tex` pelo conteúdo copiado
4. Ou crie um novo arquivo: clique **"New File"** → **"main.tex"** → Cole o conteúdo

### Passo 3: Compilar e Gerar PDF
1. Clique no botão verde **"Recompile"** (ou Ctrl+Enter)
2. O PDF será gerado automaticamente no painel direito
3. Após compilação bem-sucedida, clique em **"Download PDF"**

### Passo 4: Baixar PDF
- O arquivo será salvo como `main.pdf`
- Renomeie para: `32021BSI004_Etapa1.pdf`
- Pronto para submissão!

---

## 💻 Opção 2: Compilar Localmente (Windows/Linux/macOS)

### Prerequisitos
- Instalar LaTeX (MiKTeX no Windows, TeX Live no Linux/macOS)
- Instalar editor (TeXstudio, VSCode com LaTeX Workshop)

### Passos (Windows com MiKTeX)

```powershell
# 1. Instalar MiKTeX
# Download: https://miktex.org/download

# 2. Abrir terminal na pasta do projeto
cd "c:\Users\Leonardo\OneDrive\Documentos\VS Code\Sistemas Distribuidos\Trabalho Final"

# 3. Compilar LaTeX para PDF
pdflatex -interaction=nonstopmode "etapa-1/documentos/Etapa-1-LaTeX.tex"

# 4. Compilar novamente (para gerar índice)
pdflatex -interaction=nonstopmode "etapa-1/documentos/Etapa-1-LaTeX.tex"

# 5. PDF gerado
# Localização: Etapa-1-LaTeX.pdf
```

### Passos (Linux)

```bash
# 1. Instalar TeX Live
sudo apt install texlive-full

# 2. Navegar até a pasta
cd ~/Documentos/"VS Code"/"Sistemas Distribuidos"/"Trabalho Final"

# 3. Compilar
pdflatex etapa-1/documentos/Etapa-1-LaTeX.tex

# 4. Compilar novamente
pdflatex etapa-1/documentos/Etapa-1-LaTeX.tex
```

### Passos (macOS)

```bash
# 1. Instalar MacTeX
brew install mactex

# 2. Compilar
pdflatex etapa-1/documentos/Etapa-1-LaTeX.tex
pdflatex etapa-1/documentos/Etapa-1-LaTeX.tex
```

---

## 📊 Características do Documento LaTeX

✅ **Formatação Profissional**
- Título e capa bem estruturados
- Margens padrão ABNT (2.5cm)
- Espaçamento 1.5 entre linhas
- Cores corporativas (azul escuro #1f4788)

✅ **Conteúdo Completo**
- Todos os 7 capítulos documentados
- 7 componentes descritos em tabelas
- Diagramas de arquitetura
- Mapeamento de conceitos

✅ **Tabelas Profissionais**
- Headers com cores de fundo
- Formatação consistente
- Fácil leitura

✅ **Índice Automático**
- Gerado automaticamente
- Referências cruzadas funcionales

---

## 🎨 Customizações Disponíveis

Se quiser customizar o documento no Overleaf:

### Mudar Cor do Título
Localize a linha:
```latex
\definecolor{darkblue}{rgb}{0.12,0.28,0.53}
```

E altere os valores RGB (0-1) para a cor desejada.

### Adicionar Logo
Após `\maketitle`, adicione:
```latex
\includegraphics[width=3cm]{seu-logo.png}
```

### Mudar Informações Pessoais
Localize:
```latex
\author{
    \textbf{Leonardo Cardoso}\\
    \textit{Matrícula: 32021BSI004}\\
```

E edite conforme necessário.

### Adicionar Novas Seções
```latex
\section{Sua Nova Seção}

Conteúdo aqui...

\subsection{Subseção}

Mais conteúdo...
```

---

## 📥 Arquivos Gerados

| Arquivo | Tipo | Uso |
|---------|------|-----|
| `Etapa-1-LaTeX.tex` | LaTeX Source | Editar e compilar no Overleaf |
| `Etapa-1-LaTeX.pdf` | PDF Final | Submeter na disciplina |
| `main.pdf` (Overleaf) | PDF Compilado | Resultado da compilação online |

---

## ✔️ Checklist de Submissão

- [ ] Arquivo LaTeX copiado para o Overleaf
- [ ] Compilação bem-sucedida (sem erros)
- [ ] PDF gerado corretamente
- [ ] Nenhuma página em branco excessiva
- [ ] Índice automático funciona
- [ ] Todas as tabelas estão visíveis
- [ ] Arquivo renomeado para: `32021BSI004_Etapa1.pdf`
- [ ] Upload na plataforma da disciplina antes de 08/05

---

## 🆘 Troubleshooting

### Problema: "Package not found" no Overleaf
**Solução:** Overleaf tem todos os pacotes padrão. Se receber erro, clique no ícone de engrenagem → **"TeX Live Version"** → Selecione a versão mais recente.

### Problema: Caracteres com acento não aparecem
**Solução:** Já está configurado com `\usepackage[utf-8]{inputenc}`. Se persistir, verifique se o encoding do arquivo é UTF-8.

### Problema: Tabelas saem da margem
**Solução:** As tabelas usam `m{3cm}` para largura. Aumente o valor se necessário:
```latex
m{4cm}  % mais largo
m{2cm}  % mais estreito
```

### Problema: Índice não atualiza
**Solução:** Compile 2 vezes seguidas. Na primeira compilação, LaTeX gera o índice; na segunda, insere as referências.

---

## 📞 Contato e Suporte

**Overleaf Help:** https://www.overleaf.com/help  
**LaTeX Documentation:** https://www.latex-project.org/  
**TeX Stack Exchange:** https://tex.stackexchange.com/

---

## 📝 Versão do Documento

- **Versão:** Final v1.0
- **Data:** 04 de Maio de 2026
- **Matrícula:** 32021BSI004
- **Disciplina:** Sistemas Distribuídos
- **Deadline:** 08 de Maio de 2026 (PDF) / 11 de Maio de 2026 (Apresentação)

---

**Status: ✅ PRONTO PARA USAR NO OVERLEAF**
