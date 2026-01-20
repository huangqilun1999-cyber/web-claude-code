#!/bin/bash

echo "========================================"
echo "  Web Claude Code Development Server"
echo "========================================"
echo

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查是否在正确的目录
if [ ! -f "pnpm-workspace.yaml" ]; then
    echo -e "${RED}[ERROR] Please run this script from the project root directory.${NC}"
    exit 1
fi

# 检查pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}[ERROR] pnpm is not installed! Please install pnpm first.${NC}"
    echo "Run: npm install -g pnpm"
    exit 1
fi

# 检查Docker
if ! docker info > /dev/null 2>&1; then
    echo -e "${YELLOW}[WARNING] Docker is not running or not installed.${NC}"
    echo
    echo "Please ensure you have PostgreSQL running manually:"
    echo "  Host: localhost"
    echo "  Port: 5432"
    echo "  User: postgres"
    echo "  Password: postgres"
    echo "  Database: web_claude_code"
    echo
    echo "Or start Docker and run this script again."
    echo
    read -p "Continue without Docker? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ]; then
        exit 1
    fi
else
    # 启动PostgreSQL
    echo -e "${YELLOW}[1/6] Starting PostgreSQL...${NC}"
    docker start wcc-postgres 2>/dev/null || \
      docker run -d --name wcc-postgres \
        -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_DB=web_claude_code \
        -p 5432:5432 \
        postgres:15

    # 启动Redis（可选）
    echo -e "${YELLOW}[2/6] Starting Redis (optional)...${NC}"
    docker start wcc-redis 2>/dev/null || \
      docker run -d --name wcc-redis -p 6379:6379 redis:7

    # 等待数据库就绪
    echo -e "${YELLOW}[3/6] Waiting for database to be ready...${NC}"
    sleep 5
fi

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[4/6] Installing dependencies...${NC}"
    pnpm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR] Failed to install dependencies${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}[4/6] Dependencies already installed.${NC}"
fi

# 构建shared包
echo -e "${YELLOW}[5/6] Building shared package...${NC}"
if [ ! -d "packages/shared/dist" ]; then
    cd packages/shared && pnpm build && cd ../..
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR] Failed to build shared package${NC}"
        exit 1
    fi
else
    echo "Shared package already built."
fi

# 初始化数据库
echo -e "${YELLOW}[6/6] Initializing database...${NC}"
cd apps/web
pnpm prisma generate > /dev/null 2>&1
pnpm prisma db push --accept-data-loss 2>/dev/null
cd ../..

echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Starting services...${NC}"
echo -e "${GREEN}========================================${NC}"
echo

# 启动WebSocket服务器（后台）
cd apps/ws-server && pnpm dev &
WS_PID=$!
echo -e "${GREEN}WebSocket server started (PID: $WS_PID)${NC}"
cd ../..

sleep 3

# 启动Web应用（后台）
cd apps/web && pnpm dev &
WEB_PID=$!
echo -e "${GREEN}Web app started (PID: $WEB_PID)${NC}"
cd ../..

echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  All services started!${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo "  Web App:    http://localhost:3000"
echo "  WebSocket:  ws://localhost:8080"
echo "  Database:   localhost:5432"
echo
echo -e "${BLUE}  Press Ctrl+C to stop all services${NC}"

# 捕获中断信号
cleanup() {
    echo
    echo "Stopping services..."
    kill $WS_PID $WEB_PID 2>/dev/null
    echo "Services stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM

# 等待
wait
