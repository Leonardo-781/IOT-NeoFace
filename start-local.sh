#!/bin/bash

# ===========================================
# INICIAR SISTEMA LOCAL (Notebook)
# ===========================================

echo ""
echo "🚀 INICIANDO SISTEMA IoT LOCAL"
echo ""

# 1. Verificar Docker
echo "[1/4] Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo "✗ Docker não está instalado!"
    echo "   Instale em: https://www.docker.com/products/docker-desktop"
    exit 1
fi
DOCKER_VERSION=$(docker --version)
echo "✓ Docker: $DOCKER_VERSION"

# 2. Build
echo ""
echo "[2/4] Build Docker..."
docker-compose build
if [ $? -ne 0 ]; then
    echo "✗ Build falhou!"
    exit 1
fi
echo "✓ Build concluído"

# 3. Start
echo ""
echo "[3/4] Iniciando containers..."
docker-compose up -d
if [ $? -ne 0 ]; then
    echo "✗ Falha ao iniciar containers!"
    exit 1
fi
echo "✓ Containers iniciados"

# 4. Aguardar e verificar
echo ""
echo "[4/4] Aguardando serviços ficarem prontos..."
sleep 3

MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo "✓ Backend está online!"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    sleep 1
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "⚠ Backend ainda não respondeu. Continuando mesmo assim..."
fi

# Status final
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SISTEMA INICIADO COM SUCESSO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Informações
echo "📊 SERVIÇOS RODANDO:"
echo "  🌐 Dashboard  : http://localhost:3000"
echo "  🔌 Gateway API: http://localhost:3001"
echo "  💾 Database   : localhost:5432"
echo "  📡 MQTT       : localhost:1883"
echo ""
echo "👤 LOGIN PADRÃO:"
echo "  Usuário: admin"
echo "  Senha: 123456"
echo ""
echo "📖 PRÓXIMOS PASSOS:"
echo "  1. Abra: http://localhost:3000"
echo "  2. Faça login com admin/123456"
echo "  3. Veja dados do dashboard"
echo "  4. Configure ESP32 para conectar"
echo ""
echo "💻 PARA VER STATUS:"
echo "  Terminal: docker-compose ps"
echo "  Terminal: docker-compose logs -f backend"
echo ""
echo "🛑 PARA PARAR:"
echo "  Terminal: docker-compose down"
echo ""
