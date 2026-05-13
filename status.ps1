param(
    [switch]$Watch
)

$configPath = Join-Path $PSScriptRoot 'data\system_config.json'
$databaseHost = '127.0.0.1'
try {
    $config = Get-Content $configPath -Raw | ConvertFrom-Json
    if ($config.database.host) {
        $databaseHost = $config.database.host
    }
} catch {
    $databaseHost = '127.0.0.1'
}

Write-Host "`nPAINEL IOT - STATUS DISTRIBUIDO" -ForegroundColor Cyan
Write-Host "Atualizado: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Cyan
Write-Host ""

function Test-Endpoint {
    param([string]$Name, [string]$Url)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        Write-Host "[OK] $Name - $($response.StatusCode)" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "[ERRO] $Name" -ForegroundColor Red
        return $false
    }
}

# PM2 Status
Write-Host "PROCESSOS (PM2):" -ForegroundColor Yellow
$pmStatus = pm2 status 2>&1 | Out-String
if ($pmStatus -match "online") {
    Write-Host "[OK] PM2 Daemon ativo" -ForegroundColor Green
} else {
    Write-Host "[ERRO] PM2 nao esta rodando" -ForegroundColor Red
}

# Endpoints
Write-Host "`nENDPOINTS:" -ForegroundColor Yellow
[void](Test-Endpoint "Backend (3000)" "http://localhost:3000/api/health")
[void](Test-Endpoint "Gateway (3001)" "http://localhost:3001/")
[void](Test-Endpoint "Broker (1884)" "http://localhost:1884/health")

# Banco de Dados
Write-Host "`nBANCO DE DADOS:" -ForegroundColor Yellow
try {
    $conn = Test-NetConnection $databaseHost -Port 5432 -InformationLevel Quiet
    if ($conn) {
        Write-Host "[OK] PostgreSQL (Raspberry) - $databaseHost:5432" -ForegroundColor Green
    } else {
        Write-Host "[AVISO] PostgreSQL remoto indisponivel - dependencia externa do Raspberry ($($databaseHost):5432)" -ForegroundColor DarkYellow
    }
} catch {
    Write-Host "[AVISO] PostgreSQL remoto indisponivel - dependencia externa do Raspberry" -ForegroundColor DarkYellow
}

# Resumo
Write-Host "`nAcesso rapido: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Login: admin / 123456" -ForegroundColor Cyan

try {
    $tailscaleStatus = (& tailscale status 2>$null | Out-String)
    if ($tailscaleStatus -match '(https://[^\s]+\.ts\.net)') {
        Write-Host "Acesso publico: $($Matches[1])" -ForegroundColor Cyan
    }
} catch {
}

Write-Host "`nComandos uteis:" -ForegroundColor Yellow
Write-Host "  pm2 status         Ver status dos processos" -ForegroundColor Gray
Write-Host "  pm2 logs           Ver logs em tempo real" -ForegroundColor Gray
Write-Host "  pm2 restart all    Reiniciar todos os servicos" -ForegroundColor Gray
Write-Host ""

if ($Watch) {
    Write-Host "Atualizando a cada 10 segundos... (Ctrl+C para parar)" -ForegroundColor DarkYellow
    while ($true) {
        Start-Sleep -Seconds 10
        Clear-Host
        & $PSCommandPath
    }
}
