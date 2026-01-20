@echo off
chcp 65001 >nul
echo ========================================
echo   Stopping Web Claude Code Services
echo ========================================
echo.

:: 查找并关闭Node.js进程（谨慎使用）
echo Stopping Node.js development servers...

:: 尝试关闭特定的终端窗口
taskkill /FI "WINDOWTITLE eq WCC - WebSocket Server*" /F 2>nul
taskkill /FI "WINDOWTITLE eq WCC - Web App*" /F 2>nul

echo.
set /p DOCKER_STOP="Stop Docker containers too? (y/n): "
if /i "%DOCKER_STOP%"=="y" (
    echo Stopping Docker containers...
    docker stop wcc-postgres wcc-redis 2>nul
    echo Docker containers stopped.
)

echo.
echo ========================================
echo   Services stopped!
echo ========================================
echo.
pause
