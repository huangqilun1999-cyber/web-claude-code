@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ========================================
::  Web Claude Code - One-Click Deploy
::  Production Deployment Script (Windows)
:: ========================================

echo.
echo ╔══════════════════════════════════════════════╗
echo ║     Web Claude Code - Production Deploy      ║
echo ╚══════════════════════════════════════════════╝
echo.

:: Get script directory
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: Parse command
set "DEPLOY_MODE=%1"
if "%DEPLOY_MODE%"=="" set "DEPLOY_MODE=docker"

if /i "%DEPLOY_MODE%"=="help" goto :show_help
if /i "%DEPLOY_MODE%"=="--help" goto :show_help
if /i "%DEPLOY_MODE%"=="-h" goto :show_help
if /i "%DEPLOY_MODE%"=="docker" goto :deploy_docker
if /i "%DEPLOY_MODE%"=="local" goto :deploy_local
if /i "%DEPLOY_MODE%"=="setup" goto :setup_env
if /i "%DEPLOY_MODE%"=="pm2" goto :create_pm2

echo [ERROR] Unknown command: %DEPLOY_MODE%
goto :show_help

:: ========================================
:: Setup Environment
:: ========================================
:setup_env
echo [INFO] Setting up environment configuration...

if exist ".env" (
    set /p OVERWRITE="Environment file exists. Overwrite? (y/n): "
    if /i not "!OVERWRITE!"=="y" (
        echo [INFO] Using existing environment file.
        goto :eof
    )
)

:: Generate random secrets (simplified for Windows)
set "CHARS=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
call :generate_random POSTGRES_PASSWORD 32
call :generate_random JWT_SECRET 32
call :generate_random NEXTAUTH_SECRET 32
call :generate_random ENCRYPTION_KEY 32

:: Get domain
echo.
set /p DOMAIN="Enter your domain (e.g., example.com) or press Enter for localhost: "
if "%DOMAIN%"=="" set "DOMAIN=localhost"

if "%DOMAIN%"=="localhost" (
    set "WEB_URL=http://localhost:3000"
    set "WS_URL=ws://localhost:8080"
) else (
    set "WEB_URL=https://%DOMAIN%"
    set "WS_URL=wss://%DOMAIN%/ws"
)

:: Create .env file
(
echo # Web Claude Code - Production Environment
echo # Generated on %date% %time%
echo.
echo # Database
echo POSTGRES_PASSWORD=!POSTGRES_PASSWORD!
echo DATABASE_URL=postgresql://postgres:!POSTGRES_PASSWORD!@postgres:5432/web_claude_code
echo.
echo # Authentication
echo JWT_SECRET=!JWT_SECRET!
echo NEXTAUTH_SECRET=!NEXTAUTH_SECRET!
echo NEXTAUTH_URL=!WEB_URL!
echo.
echo # Encryption ^(must be exactly 32 characters^)
echo ENCRYPTION_KEY=!ENCRYPTION_KEY!
echo.
echo # URLs
echo NEXT_PUBLIC_WS_URL=!WS_URL!
echo.
echo # Domain
echo DOMAIN=!DOMAIN!
) > ".env"

:: Create local env files
if not exist "apps\web" mkdir "apps\web"
if not exist "apps\ws-server" mkdir "apps\ws-server"

(
echo DATABASE_URL=postgresql://postgres:!POSTGRES_PASSWORD!@localhost:5432/web_claude_code
echo NEXTAUTH_SECRET=!NEXTAUTH_SECRET!
echo NEXTAUTH_URL=!WEB_URL!
echo JWT_SECRET=!JWT_SECRET!
echo ENCRYPTION_KEY=!ENCRYPTION_KEY!
echo NEXT_PUBLIC_WS_URL=!WS_URL!
) > "apps\web\.env.local"

(
echo WS_PORT=8080
echo JWT_SECRET=!JWT_SECRET!
echo ENCRYPTION_KEY=!ENCRYPTION_KEY!
echo DATABASE_URL=postgresql://postgres:!POSTGRES_PASSWORD!@localhost:5432/web_claude_code
) > "apps\ws-server\.env"

echo.
echo [SUCCESS] Environment files created!
echo.
echo [WARNING] IMPORTANT: Save your credentials somewhere safe!
echo   PostgreSQL Password: !POSTGRES_PASSWORD!
echo   JWT Secret: !JWT_SECRET!
echo.
goto :eof

:: ========================================
:: Docker Deployment
:: ========================================
:deploy_docker
echo [INFO] Starting Docker deployment...

:: Check Docker
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running or not installed.
    echo         Install Docker Desktop: https://docs.docker.com/desktop/install/windows-install/
    pause
    exit /b 1
)

:: Check if .env exists
if not exist ".env" (
    echo [WARNING] No environment file found. Running setup...
    call :setup_env
)

:: Build and start
echo [INFO] Building Docker images...
docker compose build
if %errorlevel% neq 0 (
    docker-compose build
)

echo [INFO] Starting services...
docker compose up -d
if %errorlevel% neq 0 (
    docker-compose up -d
)

:: Wait for services
echo [INFO] Waiting for services to be ready...
timeout /t 10 /nobreak >nul

:: Run migrations
echo [INFO] Running database migrations...
docker compose exec -T web npx prisma db push --accept-data-loss 2>nul

echo.
echo ╔══════════════════════════════════════════════╗
echo ║           Services are running!              ║
echo ╚══════════════════════════════════════════════╝
echo.
echo   Web App:     http://localhost:3000
echo   WebSocket:   ws://localhost:8080
echo.
echo   Commands:
echo     View logs:    docker compose logs -f
echo     Stop:         docker compose down
echo     Restart:      docker compose restart
echo.
pause
goto :eof

:: ========================================
:: Local Deployment
:: ========================================
:deploy_local
echo [INFO] Starting local deployment...

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo         Download from: https://nodejs.org/
    pause
    exit /b 1
)

:: Check pnpm
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] pnpm is not installed!
    echo         Run: npm install -g pnpm
    pause
    exit /b 1
)

:: Check if .env exists
if not exist "apps\web\.env.local" (
    echo [WARNING] No environment file found. Running setup...
    call :setup_env
)

:: Install dependencies
echo [INFO] Installing dependencies...
call pnpm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

:: Build shared package
echo [INFO] Building shared package...
cd packages\shared
call pnpm build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build shared package
    cd ..\..
    pause
    exit /b 1
)
cd ..\..

:: Generate Prisma client
echo [INFO] Generating Prisma client...
cd apps\web
call pnpm prisma generate
cd ..\..

:: Build applications
echo [INFO] Building applications...
call pnpm build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)

:: Database migration
echo [INFO] Running database migrations...
cd apps\web
call pnpm prisma db push --accept-data-loss
cd ..\..

echo.
echo [SUCCESS] Build complete!
echo.
echo To start the services:
echo   1. Start WebSocket server: cd apps\ws-server ^&^& pnpm start
echo   2. Start Web app: cd apps\web ^&^& pnpm start
echo.
echo Or use PM2 for production:
echo   pm2 start ecosystem.config.js
echo.
pause
goto :eof

:: ========================================
:: Create PM2 Config
:: ========================================
:create_pm2
echo [INFO] Creating PM2 configuration...

(
echo module.exports = {
echo   apps: [
echo     {
echo       name: 'wcc-web',
echo       cwd: './apps/web',
echo       script: 'pnpm',
echo       args: 'start',
echo       env: {
echo         NODE_ENV: 'production',
echo         PORT: 3000
echo       },
echo       instances: 1,
echo       autorestart: true,
echo       watch: false,
echo       max_memory_restart: '1G'
echo     },
echo     {
echo       name: 'wcc-ws-server',
echo       cwd: './apps/ws-server',
echo       script: 'pnpm',
echo       args: 'start',
echo       env: {
echo         NODE_ENV: 'production',
echo         WS_PORT: 8080
echo       },
echo       instances: 1,
echo       autorestart: true,
echo       watch: false,
echo       max_memory_restart: '512M'
echo     }
echo   ]
echo };
) > "ecosystem.config.js"

echo [SUCCESS] PM2 configuration created: ecosystem.config.js
pause
goto :eof

:: ========================================
:: Show Help
:: ========================================
:show_help
echo Usage: deploy.bat [command]
echo.
echo Commands:
echo   docker    Deploy using Docker (default)
echo   local     Build for local/manual deployment
echo   setup     Setup environment configuration only
echo   pm2       Create PM2 configuration
echo   help      Show this help message
echo.
echo Examples:
echo   deploy.bat docker    # Deploy with Docker
echo   deploy.bat local     # Build without Docker
echo   deploy.bat setup     # Generate .env files
echo.
pause
goto :eof

:: ========================================
:: Helper: Generate Random String
:: ========================================
:generate_random
setlocal
set "RESULT="
set "CHARS=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
for /L %%i in (1,1,%2) do (
    set /a "IDX=!random! %% 62"
    for %%j in (!IDX!) do set "RESULT=!RESULT!!CHARS:~%%j,1!"
)
endlocal & set "%1=%RESULT%"
goto :eof
