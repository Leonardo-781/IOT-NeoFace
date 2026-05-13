#!/bin/bash

# ===========================================
# PREPARAR SERVER-STI COM LINUX MINT
# Executar no servidor remoto via SSH
# ===========================================

set -e

echo ""
echo "🚀 PREPARAR LINUX MINT PARA DOCKER + NODEJS"
echo "==========================================="
echo ""

# 1. Atualizar sistema
echo "[1/5] Atualizando Linux Mint..."
sudo apt update
sudo apt upgrade -y

# 2. Instalar Docker
echo "[2/5] Instalando Docker..."
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common gnupg lsb-release

# Adicionar repositório Docker oficial
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 3. Instalar complementos
echo "[3/5] Instalando complementos..."
sudo apt install -y nginx nodejs npm git curl wget htop

# 4. Configurar Docker
echo "[4/5] Configurando Docker..."
sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker

# 5. Verificar instalação
echo "[5/5] Verificando instalação..."
echo ""
echo "✓ Docker:"
docker --version
echo ""
echo "✓ Docker Compose:"
docker-compose --version
echo ""
echo "✓ Nginx:"
nginx -v
echo ""
echo "✓ Node.js:"
node --version
echo ""
echo "✓ npm:"
npm --version
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ LINUX MINT PREPARADO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANTE: Faça logout e login novamente para aplicar permissões do Docker:"
echo "    exit"
echo "    ssh $USER@$(hostname -I)"
echo ""
echo "Depois, continue com o deploy do projeto."
echo ""
