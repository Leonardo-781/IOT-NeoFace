@echo off
REM ===========================================
REM INICIAR SISTEMA LOCAL (Notebook)
REM ===========================================

echo.
echo 🚀 INICIANDO SISTEMA IoT LOCAL
echo.

REM 1. Verificar Docker
echo [1/4] Verificando Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Docker não está instalado!
    echo    Instale em: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo ✓ Docker encontrado
echo.

REM 2. Build
echo [2/4] Build Docker...
docker-compose build
if %errorlevel% neq 0 (
    echo ✗ Build falhou!
    pause
    exit /b 1
)
echo ✓ Build concluído
echo.

REM 3. Start
echo [3/4] Iniciando containers...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ✗ Falha ao iniciar containers!
    pause
    exit /b 1
)
echo ✓ Containers iniciados
echo.

REM 4. Aguardar
echo [4/4] Aguardando serviços ficarem prontos...
timeout /t 3 /nobreak

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✅ SISTEMA INICIADO COM SUCESSO!
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo 📊 SERVIÇOS RODANDO:
echo    🌐 Dashboard  : http://localhost:3000
echo    🔌 Gateway API: http://localhost:3001
echo    💾 Database   : localhost:5432
echo    📡 MQTT       : localhost:1883
echo.

echo 👤 LOGIN PADRÃO:
echo    Usuário: admin
echo    Senha: 123456
echo.

echo 📖 PRÓXIMOS PASSOS:
echo    1. Abra: http://localhost:3000
echo    2. Faça login com admin/123456
echo    3. Veja dados do dashboard
echo    4. Configure ESP32 para conectar
echo.

echo 💻 PARA VER STATUS:
echo    Prompt: docker-compose ps
echo    Prompt: docker-compose logs -f backend
echo.

echo 🛑 PARA PARAR:
echo    Prompt: docker-compose down
echo.

pause
