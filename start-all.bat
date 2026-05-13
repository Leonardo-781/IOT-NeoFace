@echo off
REM Script de inicializacao completa da aplicacao
REM Sobe backend, gateway, broker e monitor

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   INICIANDO PAINEL IOT DISTRIBUIDO
echo ============================================================
echo.

REM Verificar se pm2 esta instalado
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo Instalando pm2 globalmente...
    npm install -g pm2
)

REM Criar pasta de logs
if not exist logs (
    mkdir logs
    echo Pasta logs criada
)

REM Parar pm2 anterior se existir
echo Limpando processos anteriores...
pm2 kill >nul 2>&1

REM Aguardar liberacao das portas
timeout /t 2 /nobreak

REM Subir servicos
echo.
echo Iniciando servicos com pm2...
pm2 start deploy/ecosystem.config.js --env production

REM Aguardar inicializacao
timeout /t 3 /nobreak

REM Salvar configuracao
pm2 save

REM Iniciar monitor em background
echo.
echo Iniciando monitor de saude...
start /b node monitor.js --quiet

REM Executar status
echo.
call .\status.ps1

REM Publicar via Tailscale Funnel quando disponível
where tailscale.exe >nul 2>&1
if %errorlevel%==0 (
    echo.
    echo Configurando acesso publico via Tailscale...
    tailscale serve reset >nul 2>&1
    tailscale funnel reset >nul 2>&1
    tailscale serve --bg http://127.0.0.1:3000 >nul 2>&1
    tailscale funnel --bg http://127.0.0.1:3000 >nul 2>&1
    tailscale status | findstr /C:"Funnel on:" 
)

echo.
echo ============================================================
echo   TUDO PRONTO!
echo ============================================================
echo.
echo Aplicacao disponivel em: http://localhost:3000
echo Login: admin / 123456
echo.
echo Para parar: pm2 stop all
echo Para reiniciar: pm2 restart all
echo Para ver logs: pm2 logs
echo.
pause
