# Chat 7 提示词：最终集成与本地部署

## 任务说明
"Web Claude Code" 项目由6个独立Chat并行开发，现在需要你负责**最终集成**和**本地部署**。

## 你的职责
1. 检查所有模块的代码完整性
2. 解决模块间的依赖冲突
3. 集成测试
4. 配置本地开发环境
5. 启动并验证所有服务
6. 创建启动脚本

## 工作目录
```
d:\github\Web-Claude code
```

## 前置条件
以下模块已由其他Chat完成：
- Chat 1: 项目基础 + 用户系统
- Chat 2: WebSocket服务器 + Agent
- Chat 3: 对话功能
- Chat 4: 文件管理 + 编辑器
- Chat 5: 终端 + Git
- Chat 6: 模板 + 插件 + 移动端

---

## 详细任务清单

### 阶段1：代码检查

1. **检查项目结构完整性**
```bash
# 验证目录结构
ls -la
ls -la apps/
ls -la apps/web/src/
ls -la apps/ws-server/src/
ls -la apps/agent/src/
ls -la packages/shared/src/
```

2. **检查关键文件是否存在**

**必须存在的文件清单：**

```
# 根目录
- [ ] pnpm-workspace.yaml
- [ ] package.json
- [ ] turbo.json

# apps/web
- [ ] apps/web/package.json
- [ ] apps/web/next.config.js
- [ ] apps/web/tailwind.config.js
- [ ] apps/web/prisma/schema.prisma
- [ ] apps/web/src/lib/db.ts
- [ ] apps/web/src/lib/auth.ts
- [ ] apps/web/src/lib/crypto.ts
- [ ] apps/web/src/lib/websocket.ts
- [ ] apps/web/src/app/layout.tsx
- [ ] apps/web/src/app/providers.tsx
- [ ] apps/web/src/app/(auth)/login/page.tsx
- [ ] apps/web/src/app/(auth)/register/page.tsx
- [ ] apps/web/src/app/(dashboard)/layout.tsx
- [ ] apps/web/src/app/(dashboard)/workspace/page.tsx
- [ ] apps/web/src/app/api/auth/[...nextauth]/route.ts
- [ ] apps/web/src/app/api/auth/register/route.ts
- [ ] apps/web/src/app/api/agents/route.ts
- [ ] apps/web/src/stores/session-store.ts
- [ ] apps/web/src/stores/agent-store.ts
- [ ] apps/web/src/stores/file-store.ts
- [ ] apps/web/src/stores/terminal-store.ts
- [ ] apps/web/src/stores/git-store.ts
- [ ] apps/web/src/hooks/use-websocket.ts
- [ ] apps/web/src/components/chat/chat-container.tsx
- [ ] apps/web/src/components/file-tree/file-tree.tsx
- [ ] apps/web/src/components/editor/code-editor.tsx
- [ ] apps/web/src/components/terminal/terminal.tsx
- [ ] apps/web/src/components/git/git-panel.tsx

# apps/ws-server
- [ ] apps/ws-server/package.json
- [ ] apps/ws-server/src/index.ts
- [ ] apps/ws-server/src/server.ts
- [ ] apps/ws-server/src/services/connection-manager.ts
- [ ] apps/ws-server/src/handlers/client.ts
- [ ] apps/ws-server/src/handlers/agent.ts

# apps/agent
- [ ] apps/agent/package.json
- [ ] apps/agent/src/index.ts
- [ ] apps/agent/src/agent.ts
- [ ] apps/agent/src/config.ts
- [ ] apps/agent/src/handlers/claude.ts
- [ ] apps/agent/src/handlers/file-system.ts
- [ ] apps/agent/src/handlers/terminal.ts
- [ ] apps/agent/src/handlers/git.ts

# packages/shared
- [ ] packages/shared/package.json
- [ ] packages/shared/src/index.ts
- [ ] packages/shared/src/types/message.ts
- [ ] packages/shared/src/types/agent.ts
- [ ] packages/shared/src/constants/events.ts
- [ ] packages/shared/src/constants/errors.ts
```

3. **检查类型导入是否正确**
- 所有apps/*是否正确引用@wcc/shared
- 类型定义是否一致

---

### 阶段2：依赖安装与配置

1. **安装根依赖**
```bash
cd "d:\github\Web-Claude code"
pnpm install
```

2. **创建环境变量文件**

**apps/web/.env.local:**
```env
# 数据库
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/web_claude_code"

# NextAuth
NEXTAUTH_SECRET="web-claude-code-secret-change-in-production-123456"
NEXTAUTH_URL="http://localhost:3000"

# JWT
JWT_SECRET="jwt-secret-key-change-in-production-123456"

# 加密密钥（必须32字符）
ENCRYPTION_KEY="12345678901234567890123456789012"

# WebSocket
NEXT_PUBLIC_WS_URL="ws://localhost:8080"
```

**apps/ws-server/.env:**
```env
WS_PORT=8080
JWT_SECRET="jwt-secret-key-change-in-production-123456"
ENCRYPTION_KEY="12345678901234567890123456789012"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/web_claude_code"
```

3. **初始化数据库**
```bash
# 启动PostgreSQL（如果使用Docker）
docker run -d --name wcc-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=web_claude_code \
  -p 5432:5432 \
  postgres:15

# 等待数据库就绪
timeout /t 5

# 推送数据库Schema
cd apps/web
pnpm prisma db push
pnpm prisma generate
```

4. **启动Redis（可选，用于缓存）**
```bash
docker run -d --name wcc-redis -p 6379:6379 redis:7
```

---

### 阶段3：构建共享包

1. **构建shared包**
```bash
cd packages/shared
pnpm build
```

2. **检查构建结果**
```bash
ls -la packages/shared/dist/
```

---

### 阶段4：启动服务

**按以下顺序启动服务：**

1. **终端1 - 启动WebSocket服务器**
```bash
cd apps/ws-server
pnpm dev
# 预期输出: WebSocket server running on port 8080
```

2. **终端2 - 启动Web应用**
```bash
cd apps/web
pnpm dev
# 预期输出: ▲ Next.js 14.x.x
#          - Local: http://localhost:3000
```

3. **终端3 - 启动本地Agent（可选，用于测试）**
```bash
cd apps/agent
# 配置Agent
pnpm start config -s ws://localhost:8080 -k <从Web获取的密钥>
# 启动Agent
pnpm start start
```

---

### 阶段5：功能验证

**验证清单：**

1. **用户注册和登录**
   - [ ] 访问 http://localhost:3000/register
   - [ ] 创建账号
   - [ ] 登录成功

2. **设置API Key**
   - [ ] 进入设置页面
   - [ ] 添加Anthropic API Key
   - [ ] 保存成功

3. **创建Agent**
   - [ ] 进入Agent管理页面
   - [ ] 创建新Agent
   - [ ] 复制Secret Key

4. **测试Agent连接**
   - [ ] 配置本地Agent
   - [ ] 启动Agent
   - [ ] Web上显示在线状态

5. **测试对话功能**
   - [ ] 创建新会话
   - [ ] 发送测试消息
   - [ ] 验证流式输出

6. **测试文件管理**
   - [ ] 浏览文件树
   - [ ] 打开文件
   - [ ] 编辑并保存

7. **测试终端**
   - [ ] 打开终端
   - [ ] 执行命令

8. **测试Git功能**
   - [ ] 查看状态
   - [ ] 提交更改

9. **移动端测试**
   - [ ] 手机访问或浏览器模拟
   - [ ] 检查布局

---

### 阶段6：问题修复

**常见问题和解决方案：**

1. **WebSocket连接失败**
```
问题：前端无法连接WebSocket
解决：
- 检查NEXT_PUBLIC_WS_URL配置
- 确认ws-server正在运行
- 检查端口是否被占用
- 检查CORS设置
```

2. **数据库连接失败**
```
问题：Prisma连接失败
解决：
- 检查DATABASE_URL配置
- 确认PostgreSQL正在运行
- 检查用户名密码
```

3. **认证问题**
```
问题：登录后被重定向回登录页
解决：
- 检查JWT_SECRET一致性（web和ws-server必须相同）
- 检查NextAuth配置
- 清除浏览器cookie
```

4. **Agent连接问题**
```
问题：Agent无法连接服务器
解决：
- 检查Secret Key是否正确
- 检查服务器URL格式
- 查看Agent日志
```

5. **类型错误**
```
问题：TypeScript类型错误
解决：
- 确保shared包已构建
- 检查tsconfig.json配置
- 运行 pnpm install 更新依赖
```

---

### 阶段7：创建启动脚本

1. **Windows启动脚本 (start-dev.bat)**
```batch
@echo off
echo ========================================
echo   Web Claude Code Development Server
echo ========================================
echo.

:: 检查Docker
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running! Please start Docker first.
    pause
    exit /b 1
)

:: 启动PostgreSQL
echo [1/5] Starting PostgreSQL...
docker start wcc-postgres 2>nul || docker run -d --name wcc-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=web_claude_code -p 5432:5432 postgres:15

:: 启动Redis
echo [2/5] Starting Redis...
docker start wcc-redis 2>nul || docker run -d --name wcc-redis -p 6379:6379 redis:7

:: 等待数据库就绪
echo [3/5] Waiting for database...
timeout /t 5 /nobreak >nul

:: 构建shared包
echo [4/5] Building shared package...
cd packages\shared
call pnpm build
cd ..\..

:: 启动服务
echo [5/5] Starting services...

:: 在新终端启动WebSocket服务器
start "WCC - WebSocket Server" cmd /k "cd apps\ws-server && pnpm dev"

:: 等待WS服务器启动
timeout /t 3 /nobreak >nul

:: 在新终端启动Web应用
start "WCC - Web App" cmd /k "cd apps\web && pnpm dev"

echo.
echo ========================================
echo   All services started!
echo ========================================
echo.
echo   Web App:    http://localhost:3000
echo   WebSocket:  ws://localhost:8080
echo   Database:   localhost:5432
echo.
echo   Press any key to exit (services will keep running)
pause >nul
```

2. **Linux/Mac启动脚本 (start-dev.sh)**
```bash
#!/bin/bash

echo "========================================"
echo "  Web Claude Code Development Server"
echo "========================================"
echo

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Docker
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}[ERROR] Docker is not running! Please start Docker first.${NC}"
    exit 1
fi

# 启动PostgreSQL
echo -e "${YELLOW}[1/5] Starting PostgreSQL...${NC}"
docker start wcc-postgres 2>/dev/null || \
  docker run -d --name wcc-postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=web_claude_code \
    -p 5432:5432 \
    postgres:15

# 启动Redis
echo -e "${YELLOW}[2/5] Starting Redis...${NC}"
docker start wcc-redis 2>/dev/null || \
  docker run -d --name wcc-redis -p 6379:6379 redis:7

# 等待数据库就绪
echo -e "${YELLOW}[3/5] Waiting for database...${NC}"
sleep 5

# 构建shared包
echo -e "${YELLOW}[4/5] Building shared package...${NC}"
cd packages/shared && pnpm build && cd ../..

# 启动服务
echo -e "${YELLOW}[5/5] Starting services...${NC}"

# 启动WebSocket服务器
cd apps/ws-server && pnpm dev &
WS_PID=$!
echo -e "${GREEN}WebSocket server started (PID: $WS_PID)${NC}"

sleep 3

# 启动Web应用
cd ../web && pnpm dev &
WEB_PID=$!
echo -e "${GREEN}Web app started (PID: $WEB_PID)${NC}"

echo
echo -e "${GREEN}========================================"
echo "  All services started!"
echo "========================================"
echo
echo "  Web App:    http://localhost:3000"
echo "  WebSocket:  ws://localhost:8080"
echo "  Database:   localhost:5432"
echo
echo -e "  Press Ctrl+C to stop all services${NC}"

# 等待中断
trap "echo 'Stopping services...'; kill $WS_PID $WEB_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
```

3. **停止脚本 (stop-dev.bat)**
```batch
@echo off
echo Stopping Web Claude Code services...

:: 关闭终端窗口中的服务（需要手动关闭）
echo Please close the terminal windows manually.

:: 可选：停止Docker容器
set /p choice="Stop Docker containers too? (y/n): "
if /i "%choice%"=="y" (
    docker stop wcc-postgres wcc-redis
    echo Docker containers stopped.
)

echo Done.
pause
```

---

### 阶段8：生成文档

1. **更新根目录README.md**
```markdown
# Web Claude Code

通过Web远程控制Claude Code的平台。

## 快速开始

### 前置要求

- Node.js 20+
- pnpm 8+
- Docker (用于PostgreSQL和Redis)
- Claude Code CLI (本地Agent需要)

### 安装

\`\`\`bash
# 克隆仓库
git clone <repository-url>
cd web-claude-code

# 安装依赖
pnpm install

# 复制环境变量
cp apps/web/.env.example apps/web/.env.local
cp apps/ws-server/.env.example apps/ws-server/.env

# 编辑环境变量
# 确保JWT_SECRET在两个文件中相同
\`\`\`

### 启动开发环境

**Windows:**
\`\`\`bash
./start-dev.bat
\`\`\`

**Linux/Mac:**
\`\`\`bash
chmod +x start-dev.sh
./start-dev.sh
\`\`\`

### 手动启动

1. 启动数据库:
\`\`\`bash
docker run -d --name wcc-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=web_claude_code -p 5432:5432 postgres:15
\`\`\`

2. 初始化数据库:
\`\`\`bash
cd apps/web
pnpm prisma db push
\`\`\`

3. 构建共享包:
\`\`\`bash
cd packages/shared
pnpm build
\`\`\`

4. 启动WebSocket服务器:
\`\`\`bash
cd apps/ws-server
pnpm dev
\`\`\`

5. 启动Web应用:
\`\`\`bash
cd apps/web
pnpm dev
\`\`\`

6. 访问 http://localhost:3000

## 本地Agent

要在本地电脑上运行Agent:

\`\`\`bash
cd apps/agent
pnpm build
pnpm start config -s ws://your-server:8080 -k <your-secret-key>
pnpm start start
\`\`\`

## 项目结构

\`\`\`
web-claude-code/
├── apps/
│   ├── web/          # Next.js Web应用
│   ├── ws-server/    # WebSocket服务器
│   └── agent/        # 本地Agent
├── packages/
│   └── shared/       # 共享类型和工具
├── templates/        # 项目模板
└── plugins/          # 官方插件
\`\`\`

## 功能

- 远程对话：通过Web与Claude Code对话
- 文件管理：浏览、编辑、保存文件
- Web终端：完整的终端体验
- Git集成：状态、提交、推送、分支
- 项目模板：快速创建项目
- 插件系统：扩展功能
- 移动端适配：随时随地使用

## 技术栈

- Frontend: Next.js 14, TypeScript, Tailwind CSS, Zustand
- Backend: Next.js API Routes, WebSocket (ws)
- Database: PostgreSQL, Prisma ORM
- Agent: Node.js, Commander.js, node-pty

## License

MIT
```

---

### 输出要求

1. 确保所有服务可以正常启动
2. 修复任何集成问题
3. 创建启动脚本
4. 验证核心功能
5. 更新文档

### 完成标志

- [ ] 所有依赖安装成功
- [ ] 数据库迁移成功
- [ ] WebSocket服务器运行正常
- [ ] Web应用运行正常
- [ ] 用户可以注册登录
- [ ] Agent可以连接
- [ ] 对话功能正常
- [ ] 文件管理正常
- [ ] 终端功能正常
- [ ] Git功能正常
- [ ] 移动端显示正常
- [ ] 启动脚本可用
- [ ] README文档完整

---

## 问题排查指南

如果遇到问题，按以下顺序排查：

1. **依赖问题**
```bash
pnpm store prune
rm -rf node_modules
pnpm install
```

2. **数据库问题**
```bash
docker logs wcc-postgres
cd apps/web && pnpm prisma db push --force-reset
```

3. **TypeScript问题**
```bash
cd packages/shared && pnpm build
cd ../../apps/web && pnpm typecheck
```

4. **端口占用**
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :8080

# Linux/Mac
lsof -i :3000
lsof -i :8080
```

5. **清理重建**
```bash
pnpm clean  # 如果有clean脚本
rm -rf apps/web/.next
rm -rf apps/ws-server/dist
rm -rf apps/agent/dist
rm -rf packages/shared/dist
pnpm build
```
