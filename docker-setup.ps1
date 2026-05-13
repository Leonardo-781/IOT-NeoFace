# Script para setup com Docker - Windows PowerShell
# Uso: .\docker-setup.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DOCKER SETUP - Trabalho Final" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================
# 1. Verificar Docker
# ============================================
Write-Host "[1] Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker não encontrado! Instale em https://docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}

try {
    $composeVersion = docker-compose --version
    Write-Host "✓ $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Compose não encontrado!" -ForegroundColor Red
    exit 1
}

# ============================================
# 2. Criar .env se não existir
# ============================================
Write-Host "`n[2] Configurando .env..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "Criando .env com config padrão..." -ForegroundColor Cyan
    $envContent = @"
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
"@
    Set-Content -Path ".env" -Value $envContent
    Write-Host "✓ .env criado" -ForegroundColor Green
} else {
    Write-Host "✓ .env já existe" -ForegroundColor Green
}

# ============================================
# 3. Build da imagem
# ============================================
Write-Host "`n[3] Building imagem Docker..." -ForegroundColor Yellow
docker-compose -f docker-compose-remote.yml build

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Erro ao fazer build!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build concluído" -ForegroundColor Green

# ============================================
# 4. Iniciar serviços
# ============================================
Write-Host "`n[4] Iniciando serviços..." -ForegroundColor Yellow
docker-compose -f docker-compose-remote.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Erro ao iniciar serviços!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Serviços iniciados" -ForegroundColor Green

# ============================================
# 5. Aguardar e testar
# ============================================
Write-Host "`n[5] Aguardando Backend ficar online..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0

do {
    Start-Sleep -Seconds 2
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Backend está online!" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "  Tentativa $attempt/$maxAttempts..." -ForegroundColor Gray
    }
} while ($attempt -lt $maxAttempts)

if ($attempt -ge $maxAttempts) {
    Write-Host "✗ Backend não respondeu após $maxAttempts tentativas" -ForegroundColor Red
    Write-Host "   Execute: docker-compose -f docker-compose-remote.yml logs backend" -ForegroundColor Yellow
    exit 1
}

# ============================================
# 6. Mostrar informações
# ============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SETUP CONCLUÍDO!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n📍 ENDPOINTS:" -ForegroundColor Green
Write-Host "  • UI:      http://localhost:3000" -ForegroundColor White
Write-Host "  • Gateway: http://localhost:3001" -ForegroundColor White
Write-Host "  • MQTT:    mqtt://localhost:1883" -ForegroundColor White

Write-Host "`n🔐 LOGIN:" -ForegroundColor Green
Write-Host "  • Usuário: admin" -ForegroundColor White
Write-Host "  • Senha:   123456" -ForegroundColor White

Write-Host "`n📊 COMANDO ÚTEIS:" -ForegroundColor Green
Write-Host "  • Ver status:  docker-compose -f docker-compose-remote.yml ps" -ForegroundColor Gray
Write-Host "  • Ver logs:    docker-compose -f docker-compose-remote.yml logs -f backend" -ForegroundColor Gray
Write-Host "  • Parar:       docker-compose -f docker-compose-remote.yml down" -ForegroundColor Gray

Write-Host "`n✨ Pronto para usar!" -ForegroundColor Cyan
Write-Host "   Abra http://localhost:3000 no navegador`n" -ForegroundColor Cyan
