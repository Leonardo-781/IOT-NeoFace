#!/bin/bash

# ===========================================
# DEPLOY AUTOMÁTICO - Server-STI (Linux Mint)
# Executa no servidor remoto via SSH
# ===========================================

set -e

SERVER_IP="${1:-192.168.1.10}"
SSH_USER="${2:-server}"
REPO_URL="${3:-}"

echo ""
echo "🚀 DEPLOY SERVER-STI (LINUX MINT)"
echo "=================================="
echo "Server IP: $SERVER_IP"
echo "SSH User: $SSH_USER"
echo ""

# 1. Preparar Linux Mint
echo "[1/6] Preparando Linux Mint..."
scp prepare-linux-mint.sh $SSH_USER@$SERVER_IP:~/
ssh $SSH_USER@$SERVER_IP 'bash ~/prepare-linux-mint.sh'

echo ""
echo "⚠️  Aguarde logout/login..."
sleep 2

# 2. Copiar projeto
echo "[2/6] Copiando projeto..."
if [ -n "$REPO_URL" ]; then
    ssh $SSH_USER@$SERVER_IP "cd ~ && git clone $REPO_URL trabalho-final"
else
    # Copiar local
    ssh $SSH_USER@$SERVER_IP 'mkdir -p ~/trabalho-final'
    scp -r . $SSH_USER@$SERVER_IP:~/trabalho-final/
fi

# 3. Build Docker
echo "[3/6] Building Docker images..."
ssh $SSH_USER@$SERVER_IP 'cd ~/trabalho-final && docker-compose build'

# 4. Start containers
echo "[4/6] Iniciando containers..."
ssh $SSH_USER@$SERVER_IP 'cd ~/trabalho-final && docker-compose up -d'

sleep 5

# 5. Configurar Nginx
echo "[5/6] Configurando Nginx..."
ssh $SSH_USER@$SERVER_IP << 'EOF'
    sudo cp ~/trabalho-final/deploy/nginx/server-sti-nginx.conf /etc/nginx/sites-available/server-sti
    sudo ln -s /etc/nginx/sites-available/server-sti /etc/nginx/sites-enabled/server-sti 2>/dev/null || true
    sudo nginx -t
    sudo systemctl reload nginx
EOF

# 6. Verificar
echo "[6/6] Verificando..."
ssh $SSH_USER@$SERVER_IP << 'EOF'
    echo ""
    echo "✅ Status dos containers:"
    cd ~/trabalho-final
    docker-compose ps
    echo ""
    echo "✅ Backend health:"
    curl -s http://127.0.0.1:3000/health | head -c 100
    echo ""
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOY CONCLUÍDO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Acesse: http://$SERVER_IP"
echo "👤 Login: admin / 123456"
echo ""
echo "📖 Para mais informações, veja DEPLOY_SERVER_STI.md"
echo ""
