#!/bin/bash
# Script para setup com Docker - Linux/Mac
# Uso: bash docker-setup.sh

set -e

echo ""
echo "========================================"
echo "DOCKER SETUP - Trabalho Final"
echo "========================================"
echo ""

# ============================================
# 1. Verificar Docker
# ============================================
echo "[1] Verificando Docker..." 
if ! command -v docker &> /dev/null; then
    echo "✗ Docker não encontrado! Instale em https://docker.com/products/docker-desktop"
    exit 1
fi
echo "✓ $(docker --version)"

if ! command -v docker-compose &> /dev/null; then
    echo "✗ Docker Compose não encontrado!"
    exit 1
fi
echo "✓ $(docker-compose --version)"

# ============================================
# 2. Criar .env se não existir
# ============================================
echo ""
echo "[2] Configurando .env..."
if [ ! -f ".env" ]; then
    echo "Criando .env com config padrão..."
    cat > .env << 'EOF'
POSTGRES_HOST=rasp-local
POSTGRES_PORT=5432
POSTGRES_DB=iot_monitoring
POSTGRES_USER=iot_user
POSTGRES_PASSWORD=iot_pass123

BACKEND_PORT=3000
GATEWAY_PORT=3001
MQTT_PORT=1883
INGEST_HTTP_PORT=3102

LOGIN_USER=admin
LOGIN_PASSWORD=123456

DB_RETENTION_DAYS=30
SIMULATION_INTERVAL_MS=5000
NODE_ENV=production
EOF
    echo "✓ .env criado"
else
    echo "✓ .env já existe"
fi

# ============================================
# 3. Build da imagem
# ============================================
echo ""
echo "[3] Building imagem Docker..."
docker-compose -f docker-compose-remote.yml build

if [ $? -ne 0 ]; then
    echo "✗ Erro ao fazer build!"
    exit 1
fi
echo "✓ Build concluído"

# ============================================
# 4. Iniciar serviços
# ============================================
echo ""
echo "[4] Iniciando serviços..."
docker-compose -f docker-compose-remote.yml up -d

if [ $? -ne 0 ]; then
    echo "✗ Erro ao iniciar serviços!"
    exit 1
fi
echo "✓ Serviços iniciados"

# ============================================
# 5. Aguardar e testar
# ============================================
echo ""
echo "[5] Aguardando Backend ficar online..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    sleep 2
    attempt=$((attempt + 1))
    
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo "✓ Backend está online!"
        break
    fi
    
    if [ $((attempt % 5)) -eq 0 ]; then
        echo "  Tentativa $attempt/$max_attempts..."
    fi
done

if [ $attempt -ge $max_attempts ]; then
    echo "✗ Backend não respondeu após $max_attempts tentativas"
    echo "   Execute: docker-compose -f docker-compose-remote.yml logs backend"
    exit 1
fi

# ============================================
# 6. Mostrar informações
# ============================================
echo ""
echo "========================================"
echo "SETUP CONCLUÍDO!"
echo "========================================"

echo ""
echo "📍 ENDPOINTS:"
echo "  • UI:      http://localhost:3000"
echo "  • Gateway: http://localhost:3001"
echo "  • MQTT:    mqtt://localhost:1883"

echo ""
echo "🔐 LOGIN:"
echo "  • Usuário: admin"
echo "  • Senha:   123456"

echo ""
echo "📊 COMANDO ÚTEIS:"
echo "  • Ver status:  docker-compose -f docker-compose-remote.yml ps"
echo "  • Ver logs:    docker-compose -f docker-compose-remote.yml logs -f backend"
echo "  • Parar:       docker-compose -f docker-compose-remote.yml down"

echo ""
echo "✨ Pronto para usar!"
echo "   Abra http://localhost:3000 no navegador"
echo ""
