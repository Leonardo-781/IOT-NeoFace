#!/usr/bin/env pwsh

# ===========================================
# DEPLOY AUTOMÁTICO - Server-STI (Linux Mint)
# Executa no servidor remoto via SSH
# ===========================================

param(
    [string]$ServerIP = "192.168.1.10",
    [string]$SSHUser = "server",
    [string]$RepoURL = ""
)

Write-Host ""
Write-Host "🚀 DEPLOY SERVER-STI (LINUX MINT)" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Server IP: $ServerIP" -ForegroundColor Yellow
Write-Host "SSH User: $SSHUser" -ForegroundColor Yellow
Write-Host ""

function Invoke-SSH {
    param(
        [string]$Command
    )
    ssh $SSHUser@$ServerIP $Command
}

function Invoke-SSHScript {
    param(
        [string]$Script
    )
    $Command = $Script -replace "`n", "; "
    ssh $SSHUser@$ServerIP $Command
}

# 1. Preparar Linux Mint
Write-Host "[1/6] Preparando Linux Mint..." -ForegroundColor Yellow
scp prepare-linux-mint.sh "$SSHUser@$ServerIP`:~/"
Invoke-SSH "bash ~/prepare-linux-mint.sh"

Write-Host ""
Write-Host "⚠️  Aguarde logout/login no servidor se for a primeira vez com Docker..." -ForegroundColor Yellow

# 2. Copiar projeto
Write-Host "[2/6] Copiando projeto..." -ForegroundColor Yellow
Invoke-SSH "mkdir -p ~/trabalho-final"
if ($RepoURL) {
    Invoke-SSH "cd ~ && git clone $RepoURL trabalho-final"
} else {
    # Copiar local via SCP
    $ProjectPath = Get-Location
    scp -r "$ProjectPath\*" "$SSHUser@$ServerIP`:~/trabalho-final/"
}

# 3. Build Docker
Write-Host "[3/6] Building Docker images..." -ForegroundColor Yellow
Invoke-SSH "cd ~/trabalho-final && docker-compose build"

# 4. Start containers
Write-Host "[4/6] Iniciando containers..." -ForegroundColor Yellow
Invoke-SSH "cd ~/trabalho-final && docker-compose up -d"
Start-Sleep -Seconds 5

# 5. Configurar Nginx
Write-Host "[5/6] Configurando Nginx..." -ForegroundColor Yellow
Invoke-SSHScript @"
    sudo cp ~/trabalho-final/deploy/nginx/server-sti-nginx.conf /etc/nginx/sites-available/server-sti;
    sudo ln -s /etc/nginx/sites-available/server-sti /etc/nginx/sites-enabled/server-sti 2>/dev/null || true;
    sudo nginx -t;
    sudo systemctl reload nginx
"@

# 6. Verificar
Write-Host "[6/6] Verificando..." -ForegroundColor Yellow
Invoke-SSHScript @"
    echo '';
    echo '✅ Status dos containers:';
    cd ~/trabalho-final;
    docker-compose ps;
    echo '';
    echo '✅ Backend health:';
    curl -s http://127.0.0.1:3000/health | head -c 100;
    echo ''
"@

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ DEPLOY CONCLUÍDO!" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Acesse: http://$ServerIP" -ForegroundColor Green
Write-Host "👤 Login: admin / 123456" -ForegroundColor Green
Write-Host ""
Write-Host "📖 Para mais informações, veja DEPLOY_SERVER_STI.md" -ForegroundColor Yellow
Write-Host ""
