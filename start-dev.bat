@echo off
chcp 65001 >nul
echo ========================================
echo   Web Claude Code Development Server
echo ========================================
echo.

:: 检查是否在正确的目录
if not exist "pnpm-workspace.yaml" (
    echo [ERROR] Please run this script from the project root directory.
    pause
    exit /b 1
)

:: 检查pnpm
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] pnpm is not installed! Please install pnpm first.
    echo Run: npm install -g pnpm
    pause
    exit /b 1
)

:: 检查Docker
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Docker is not running or not installed.
    echo.
    echo Please ensure you have PostgreSQL running manually:
    echo   Host: localhost
    echo   Port: 5432
    echo   User: postgres
    echo   Password: postgres
    echo   Database: web_claude_code
    echo.
    echo Or start Docker Desktop and run this script again.
    echo.
    set /p CONTINUE="Continue without Docker? (y/n): "
    if /i not "%CONTINUE%"=="y" exit /b 1
    goto :skip_docker
)

:: 启动PostgreSQL
echo [1/6] Starting PostgreSQL...
docker start wcc-postgres 2>nul || docker run -d --name wcc-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=web_claude_code -p 5432:5432 postgres:15
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start PostgreSQL container
    pause
    exit /b 1
)

:: 启动Redis（可选）
echo [2/6] Starting Redis (optional)...
docker start wcc-redis 2>nul || docker run -d --name wcc-redis -p 6379:6379 redis:7

:: 等待数据库就绪
echo [3/6] Waiting for database to be ready...
timeout /t 5 /nobreak >nul

:skip_docker

:: 检查依赖是否已安装
if not exist "node_modules" (
    echo [4/6] Installing dependencies...
    call pnpm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo [4/6] Dependencies already installed.
)

:: 构建shared包
echo [5/6] Building shared package...
cd packages\shared
if not exist "dist" (
    call pnpm build
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to build shared package
        cd ..\..
        pause
        exit /b 1
    )
) else (
    echo Shared package already built.
)
cd ..\..

:: 初始化数据库（如果需要）
echo [6/6] Initializing database...
cd apps\web
call pnpm prisma generate >nul 2>&1
call pnpm prisma db push --accept-data-loss 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Database initialization may have failed. Please check manually.
)
cd ..\..

echo.
echo ========================================
echo   Starting services...
echo ========================================
echo.

:: 在新终端启动WebSocket服务器
start "WCC - WebSocket Server" cmd /k "cd /d "%CD%\apps\ws-server" && pnpm dev"

:: 等待WS服务器启动
echo Waiting for WebSocket server to start...
timeout /t 3 /nobreak >nul

:: 在新终端启动Web应用
start "WCC - Web App" cmd /k "cd /d "%CD%\apps\web" && pnpm dev"

echo.
echo ========================================
echo   All services started!
echo ========================================
echo.
echo   Web App:    http://localhost:3000
echo   WebSocket:  ws://localhost:8080
echo   Database:   localhost:5432
echo.
echo   To stop services, close the terminal windows or run stop-dev.bat
echo.
echo   Press any key to exit (services will keep running)
pause >nul
