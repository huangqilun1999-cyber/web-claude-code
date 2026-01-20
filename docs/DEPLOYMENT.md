# Deployment Guide | 部署指南

[English](#english) | [中文](#中文)

---

<a name="english"></a>

# English

## Overview

Web Claude Code supports multiple deployment methods:

| Method | Best For | Requirements |
|--------|----------|--------------|
| **Docker** | Production, easy setup | Docker, Docker Compose |
| **Local** | Development, customization | Node.js 20+, pnpm, PostgreSQL |
| **Cloud** | Scalability, high availability | Cloud provider account |

## Quick Start

### One-Click Deploy

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh docker
```

**Windows:**
```cmd
deploy.bat docker
```

The script will:
1. Generate secure credentials automatically
2. Create all required configuration files
3. Build Docker images
4. Start all services
5. Initialize the database

## Deployment Methods

### 1. Docker Deployment (Recommended)

Best for production environments with minimal configuration.

#### Prerequisites
- Docker 20.10+
- Docker Compose v2+
- 2GB RAM minimum
- 10GB disk space

#### Steps

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/web-claude-code.git
cd web-claude-code

# 2. Run deployment script
./deploy.sh docker

# 3. Access the application
# Web App: http://localhost:3000
# WebSocket: ws://localhost:8080
```

#### Configuration

The script creates a `.env` file with all necessary settings. To customize:

```bash
# Edit the environment file
nano .env

# Restart services
docker compose restart
```

#### Management Commands

```bash
# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f web
docker compose logs -f ws-server

# Stop services
docker compose down

# Stop and remove data
docker compose down -v

# Restart services
docker compose restart

# Update to latest version
git pull
docker compose build
docker compose up -d
```

### 2. Local Deployment

Best for development or when you need more control.

#### Prerequisites
- Node.js 20+
- pnpm 8+
- PostgreSQL 15+
- Redis 7+ (optional)

#### Steps

```bash
# 1. Setup environment
./deploy.sh setup

# 2. Start PostgreSQL
# Option A: Using Docker
docker run -d --name wcc-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=web_claude_code \
  -p 5432:5432 \
  postgres:15

# Option B: Use existing PostgreSQL
# Update DATABASE_URL in .env files

# 3. Build the application
./deploy.sh local

# 4. Start services (choose one method)

# Method A: Manual
cd apps/ws-server && pnpm start &
cd apps/web && pnpm start &

# Method B: Using PM2 (recommended for production)
npm install -g pm2
./deploy.sh pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Cloud Deployment

#### Vercel + Railway (Recommended for beginners)

**Web App on Vercel:**

1. Fork the repository
2. Import to Vercel
3. Set root directory to `apps/web`
4. Add environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `JWT_SECRET`
   - `ENCRYPTION_KEY`
   - `NEXT_PUBLIC_WS_URL`

**Database on Railway:**

1. Create new project on Railway
2. Add PostgreSQL service
3. Copy connection URL to Vercel env

**WebSocket Server:**
Deploy `apps/ws-server` to Railway or Render.

#### AWS / GCP / Azure

For enterprise deployments, use Kubernetes:

```bash
# Build images
docker build -t wcc-web:latest -f apps/web/Dockerfile .
docker build -t wcc-ws:latest -f apps/ws-server/Dockerfile .

# Push to registry
docker tag wcc-web:latest your-registry/wcc-web:latest
docker push your-registry/wcc-web:latest
```

See `docs/kubernetes/` for Kubernetes manifests.

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | JWT signing secret (32+ chars) | Yes |
| `NEXTAUTH_SECRET` | NextAuth.js secret | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `ENCRYPTION_KEY` | API key encryption (exactly 32 chars) | Yes |
| `NEXT_PUBLIC_WS_URL` | WebSocket server URL | Yes |
| `WS_PORT` | WebSocket server port | No (default: 8080) |

### Generating Secrets

```bash
# Generate random secret
openssl rand -base64 32

# Generate 32-char encryption key
openssl rand -hex 16
```

### HTTPS/SSL Setup

#### Using Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Web App
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

#### Using Caddy (Automatic HTTPS)

```caddyfile
your-domain.com {
    reverse_proxy /ws localhost:8080
    reverse_proxy * localhost:3000
}
```

## Post-Deployment

### 1. Create Admin Account

1. Visit `http://your-domain.com`
2. Click "Register"
3. Create your account
4. (Optional) Set as admin in database:
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
   ```

### 2. Setup Local Agent

To connect your local machine:

```bash
# On your local machine
cd apps/agent
pnpm build

# Get secret key from web dashboard
pnpm start config -s wss://your-domain.com/ws -k <secret-key>
pnpm start start
```

### 3. Monitoring

**Using PM2:**
```bash
pm2 monit
pm2 logs
```

**Using Docker:**
```bash
docker compose logs -f
docker stats
```

## Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
psql postgresql://postgres:password@localhost:5432/web_claude_code
```

### WebSocket Connection Failed
```bash
# Check ws-server is running
curl -i http://localhost:8080/health

# Check firewall
sudo ufw allow 8080
```

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules .next
pnpm install
pnpm build
```

## Backup & Restore

### Backup Database
```bash
# Docker
docker exec wcc-postgres pg_dump -U postgres web_claude_code > backup.sql

# Local
pg_dump -U postgres web_claude_code > backup.sql
```

### Restore Database
```bash
# Docker
docker exec -i wcc-postgres psql -U postgres web_claude_code < backup.sql

# Local
psql -U postgres web_claude_code < backup.sql
```

---

<a name="中文"></a>

# 中文

## 概述

Web Claude Code 支持多种部署方式：

| 方式 | 适用场景 | 要求 |
|------|----------|------|
| **Docker** | 生产环境、快速部署 | Docker, Docker Compose |
| **本地** | 开发环境、自定义 | Node.js 20+, pnpm, PostgreSQL |
| **云端** | 高可用、可扩展 | 云服务商账号 |

## 快速开始

### 一键部署

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh docker
```

**Windows:**
```cmd
deploy.bat docker
```

脚本会自动：
1. 生成安全的凭据
2. 创建所有配置文件
3. 构建 Docker 镜像
4. 启动所有服务
5. 初始化数据库

## 部署方式

### 1. Docker 部署（推荐）

最适合生产环境，配置简单。

#### 前置要求
- Docker 20.10+
- Docker Compose v2+
- 最少 2GB 内存
- 10GB 磁盘空间

#### 步骤

```bash
# 1. 克隆仓库
git clone https://github.com/yourusername/web-claude-code.git
cd web-claude-code

# 2. 运行部署脚本
./deploy.sh docker

# 3. 访问应用
# Web 应用: http://localhost:3000
# WebSocket: ws://localhost:8080
```

#### 配置

脚本会创建包含所有必要设置的 `.env` 文件。如需自定义：

```bash
# 编辑环境文件
nano .env

# 重启服务
docker compose restart
```

#### 管理命令

```bash
# 查看日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f web
docker compose logs -f ws-server

# 停止服务
docker compose down

# 停止并删除数据
docker compose down -v

# 重启服务
docker compose restart

# 更新到最新版本
git pull
docker compose build
docker compose up -d
```

### 2. 本地部署

适合开发环境或需要更多控制的场景。

#### 前置要求
- Node.js 20+
- pnpm 8+
- PostgreSQL 15+
- Redis 7+（可选）

#### 步骤

```bash
# 1. 设置环境
./deploy.sh setup

# 2. 启动 PostgreSQL
# 方式 A: 使用 Docker
docker run -d --name wcc-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=web_claude_code \
  -p 5432:5432 \
  postgres:15

# 方式 B: 使用现有 PostgreSQL
# 更新 .env 文件中的 DATABASE_URL

# 3. 构建应用
./deploy.sh local

# 4. 启动服务（选择一种方式）

# 方式 A: 手动启动
cd apps/ws-server && pnpm start &
cd apps/web && pnpm start &

# 方式 B: 使用 PM2（生产环境推荐）
npm install -g pm2
./deploy.sh pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. 云端部署

#### Vercel + Railway（新手推荐）

**Web 应用部署到 Vercel:**

1. Fork 仓库
2. 导入到 Vercel
3. 设置根目录为 `apps/web`
4. 添加环境变量：
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `JWT_SECRET`
   - `ENCRYPTION_KEY`
   - `NEXT_PUBLIC_WS_URL`

**数据库部署到 Railway:**

1. 在 Railway 创建新项目
2. 添加 PostgreSQL 服务
3. 复制连接 URL 到 Vercel 环境变量

**WebSocket 服务器:**
将 `apps/ws-server` 部署到 Railway 或 Render。

## 配置

### 环境变量

| 变量 | 描述 | 必需 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | 是 |
| `JWT_SECRET` | JWT 签名密钥（32+ 字符） | 是 |
| `NEXTAUTH_SECRET` | NextAuth.js 密钥 | 是 |
| `NEXTAUTH_URL` | 应用 URL | 是 |
| `ENCRYPTION_KEY` | API 密钥加密（正好 32 字符） | 是 |
| `NEXT_PUBLIC_WS_URL` | WebSocket 服务器 URL | 是 |
| `WS_PORT` | WebSocket 服务器端口 | 否（默认: 8080） |

### 生成密钥

```bash
# 生成随机密钥
openssl rand -base64 32

# 生成 32 字符加密密钥
openssl rand -hex 16
```

### HTTPS/SSL 设置

#### 使用 Nginx 反向代理

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Web 应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

#### 使用 Caddy（自动 HTTPS）

```caddyfile
your-domain.com {
    reverse_proxy /ws localhost:8080
    reverse_proxy * localhost:3000
}
```

## 部署后设置

### 1. 创建管理员账号

1. 访问 `http://your-domain.com`
2. 点击"注册"
3. 创建账号
4. （可选）在数据库中设置为管理员：
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
   ```

### 2. 设置本地 Agent

连接你的本地机器：

```bash
# 在本地机器上
cd apps/agent
pnpm build

# 从 Web 控制台获取密钥
pnpm start config -s wss://your-domain.com/ws -k <secret-key>
pnpm start start
```

### 3. 监控

**使用 PM2:**
```bash
pm2 monit
pm2 logs
```

**使用 Docker:**
```bash
docker compose logs -f
docker stats
```

## 故障排除

### 数据库连接失败
```bash
# 检查 PostgreSQL 是否运行
docker ps | grep postgres

# 测试连接
psql postgresql://postgres:password@localhost:5432/web_claude_code
```

### WebSocket 连接失败
```bash
# 检查 ws-server 是否运行
curl -i http://localhost:8080/health

# 检查防火墙
sudo ufw allow 8080
```

### 构建错误
```bash
# 清除缓存重新构建
rm -rf node_modules .next
pnpm install
pnpm build
```

## 备份与恢复

### 备份数据库
```bash
# Docker
docker exec wcc-postgres pg_dump -U postgres web_claude_code > backup.sql

# 本地
pg_dump -U postgres web_claude_code > backup.sql
```

### 恢复数据库
```bash
# Docker
docker exec -i wcc-postgres psql -U postgres web_claude_code < backup.sql

# 本地
psql -U postgres web_claude_code < backup.sql
```
