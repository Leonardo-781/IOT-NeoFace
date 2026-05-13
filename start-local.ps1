#!/usr/bin/env pwsh

# ===========================================
# INICIAR SISTEMA LOCAL (Notebook)
# ===========================================

Write-Host "" -ForegroundColor Green
Write-Host "🚀 INICIANDO SISTEMA IoT LOCAL" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Green

# 1. Verificar Docker
Write-Host "[1/4] Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker não está instalado!" -ForegroundColor Red
    Write-Host "   Instale em: https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}

# 2. Build
Write-Host "`n[2/4] Build Docker..." -ForegroundColor Yellow
docker-compose build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build falhou!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build concluído" -ForegroundColor Green

# 3. Start
Write-Host "`n[3/4] Iniciando containers..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Falha ao iniciar containers!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Containers iniciados" -ForegroundColor Green

# 4. Aguardar e verificar
Write-Host "`n[4/4] Aguardando serviços ficarem prontos..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

$maxAttempts = 30
$attempt = 0
while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Backend está online!" -ForegroundColor Green
            break
        }
    } catch {
        $attempt++
        Start-Sleep -Seconds 1
    }
}

if ($attempt -eq $maxAttempts) {
    Write-Host "⚠ Backend ainda não respondeu. Continuando mesmo assim..." -ForegroundColor Yellow
}

# Status final
Write-Host "`n" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ SISTEMA INICIADO COM SUCESSO!" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""

# Informações
Write-Host "📊 SERVIÇOS RODANDO:" -ForegroundColor Green
Write-Host "  🌐 Dashboard  : http://localhost:3000" -ForegroundColor Cyan
Write-Host "  🔌 Gateway API: http://localhost:3001" -ForegroundColor Cyan
Write-Host "  💾 Database   : localhost:5432" -ForegroundColor Cyan
Write-Host "  📡 MQTT       : localhost:1883" -ForegroundColor Cyan
Write-Host ""
Write-Host "👤 LOGIN PADRÃO:" -ForegroundColor Green
Write-Host "  Usuário: admin" -ForegroundColor Cyan
Write-Host "  Senha: 123456" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 PRÓXIMOS PASSOS:" -ForegroundColor Green
Write-Host "  1. Abra: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  2. Faça login com admin/123456" -ForegroundColor Cyan
Write-Host "  3. Veja dados do dashboard" -ForegroundColor Cyan
Write-Host "  4. Configure ESP32 para conectar" -ForegroundColor Cyan
Write-Host ""
Write-Host "💻 PARA VER STATUS:" -ForegroundColor Green
Write-Host "  PowerShell: docker-compose ps" -ForegroundColor Cyan
Write-Host "  PowerShell: docker-compose logs -f backend" -ForegroundColor Cyan
Write-Host ""
Write-Host "🛑 PARA PARAR:" -ForegroundColor Green
Write-Host "  PowerShell: docker-compose down" -ForegroundColor Cyan
Write-Host ""
