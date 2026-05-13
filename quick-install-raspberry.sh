#!/bin/bash
# Quick Install: Tudo no Raspberry Pi
# Uso: curl -sSL https://seu-url.sh | bash
# Ou: bash quick-install-raspberry.sh

set -e

echo ""
echo "========================================="
echo "⚡ QUICK INSTALL - Trabalho Final"
echo "    100% Online no Raspberry Pi"
echo "========================================="
echo ""

# ============================================
# 1. Instalar Docker
# ============================================
echo "[1] Instalando Docker..."
curl -sSL https://get.docker.com | sh
sudo usermod -aG docker pi
echo "✓ Docker instalado"

# ============================================
# 2. Instalar Docker Compose
# ============================================
echo ""
echo "[2] Instalando Docker Compose..."
ARCH=$(uname -m)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-Linux-${ARCH}" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
echo "✓ Docker Compose instalado"

# ============================================
# 3. Clonar/Preparar Projeto
# ============================================
echo ""
echo "[3] Preparando projeto..."

if [ ! -d "$HOME/trabalho-final" ]; then
    mkdir -p $HOME/trabalho-final
    echo "Pasta criada: $HOME/trabalho-final"
    echo "⚠️  Copie os arquivos do projeto para: $HOME/trabalho-final"
    echo "   (use: scp -r 'C:\\...\\Trabalho Final\\*' leo@rasp-local:~/trabalho-final)"
    exit 1
fi

cd $HOME/trabalho-final
echo "✓ Usando: $HOME/trabalho-final"

# ============================================
# 4. Criar .env
# ============================================
echo ""
echo "[4] Criando .env..."
cat > .env << 'EOF'
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=iot_monitoring
POSTGRES_USER=iot_user
POSTGRES_PASSWORD=iot_pass123
BACKEND_PORT=3000
GATEWAY_PORT=3001
MQTT_PORT=1883
LOGIN_USER=admin
LOGIN_PASSWORD=123456
NODE_ENV=production
EOF
echo "✓ .env criado"

# ============================================
# 5. Build Docker
# ============================================
echo ""
echo "[5] Building imagens Docker..."
echo "⏱️  Isto pode levar 10-15 minutos..."
docker-compose -f docker-compose-standalone.yml build

if [ $? -ne 0 ]; then
    echo "✗ Erro no build!"
    exit 1
fi
echo "✓ Build concluído"

# ============================================
# 6. Iniciar serviços
# ============================================
echo ""
echo "[6] Iniciando serviços..."
docker-compose -f docker-compose-standalone.yml up -d

sleep 5
echo "✓ Serviços iniciados"

# ============================================
# 7. Auto-start na boot
# ============================================
echo ""
echo "[7] Configurando auto-start..."

cat > ~/start-tf.sh << 'EOF'
#!/bin/bash
cd ~/trabalho-final
docker-compose -f docker-compose-standalone.yml up -d
EOF

chmod +x ~/start-tf.sh

# Adicionar ao crontab
(crontab -l 2>/dev/null; echo "@reboot sleep 10 && /home/pi/start-tf.sh") | crontab -

echo "✓ Auto-start configurado"

# ============================================
# 8. Verificação
# ============================================
echo ""
echo "[8] Verificando status..."

sleep 5

if docker-compose -f docker-compose-standalone.yml ps | grep -q "Up"; then
    echo "✓ Containers rodando"
else
    echo "⚠️  Containers podem ainda estar iniciando..."
fi

# ============================================
# 9. Informações Finais
# ============================================
echo ""
echo "========================================="
echo "✨ INSTALAÇÃO CONCLUÍDA!"
echo "========================================="
echo ""
echo "📍 ACESSAR:"
echo "  • Dashboard: http://rasp-local:3000"
echo "  • API:       http://rasp-local:3001"
echo "  • MQTT:      mqtt://rasp-local:1883"
echo ""
echo "🔐 LOGIN:"
echo "  • Usuário: admin"
echo "  • Senha:   123456"
echo ""
echo "📋 COMANDOS ÚTEIS:"
echo "  • Ver status:  docker-compose -f docker-compose-standalone.yml ps"
echo "  • Ver logs:    docker-compose -f docker-compose-standalone.yml logs -f"
echo "  • Parar:       docker-compose -f docker-compose-standalone.yml down"
echo "  • Reiniciar:   docker-compose -f docker-compose-standalone.yml restart"
echo ""
echo "🎯 O RASPBERRY ESTÁ SEMPRE ONLINE!"
echo "   (Auto-inicia após reboot)"
echo ""
