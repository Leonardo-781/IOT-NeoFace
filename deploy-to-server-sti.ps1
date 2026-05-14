#!/usr/bin/env pwsh

param(
    [string]$ServerIP = "192.168.1.10",
    [string]$SSHUser = "server",
    [string]$RepoURL = ""
)

Write-Host ""
Write-Host "DEPLOY SERVER-STI (LINUX MINT)" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Server IP: $ServerIP" -ForegroundColor Yellow
Write-Host "SSH User: $SSHUser" -ForegroundColor Yellow
Write-Host ""

function Invoke-SSH {
    param(
        [string]$Command
    )
    ssh "$SSHUser@$ServerIP" $Command
}

function Invoke-SSHScript {
    param(
        [string]$Script
    )
    $Command = $Script -replace "`n", "; "
    ssh "$SSHUser@$ServerIP" $Command
}

Write-Host "[1/6] Preparing Linux Mint..." -ForegroundColor Yellow
scp "prepare-linux-mint.sh" "$SSHUser@$ServerIP`:~/"
Invoke-SSH "bash ~/prepare-linux-mint.sh"

Write-Host ""
Write-Host "If this is first Docker setup, reconnect may be needed." -ForegroundColor Yellow

Write-Host "[2/6] Copying project..." -ForegroundColor Yellow
Invoke-SSH "mkdir -p ~/trabalho-final"
if ($RepoURL) {
    Invoke-SSH "cd ~ && git clone $RepoURL trabalho-final"
} else {
    $ProjectPath = Get-Location
    scp -r "$ProjectPath\*" "$SSHUser@$ServerIP`:~/trabalho-final/"
}

Write-Host "[3/6] Building Docker images..." -ForegroundColor Yellow
Invoke-SSH "cd ~/trabalho-final && docker-compose build"

Write-Host "[4/6] Starting containers..." -ForegroundColor Yellow
Invoke-SSH "cd ~/trabalho-final && docker-compose up -d"
Start-Sleep -Seconds 5

Write-Host "[5/6] Configuring Nginx..." -ForegroundColor Yellow
Invoke-SSHScript @"
    sudo cp ~/trabalho-final/deploy/nginx/server-sti-nginx.conf /etc/nginx/sites-available/server-sti;
    sudo ln -s /etc/nginx/sites-available/server-sti /etc/nginx/sites-enabled/server-sti 2>/dev/null || true;
    sudo nginx -t;
    sudo systemctl reload nginx
"@

Write-Host "[6/6] Verifying..." -ForegroundColor Yellow
Invoke-SSHScript @"
    echo '';
    echo 'Container status:';
    cd ~/trabalho-final;
    docker-compose ps;
    echo '';
    echo 'Backend health:';
    curl -s http://127.0.0.1:3000/health | head -c 200;
    echo ''
"@

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "DEPLOY COMPLETED" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Open: http://$ServerIP" -ForegroundColor Green
Write-Host "Login: admin / 123456" -ForegroundColor Green
Write-Host ""
