# Web Claude Code

<div align="center">

![Web Claude Code](https://img.shields.io/badge/Web-Claude%20Code-blue?style=for-the-badge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

**通过 Web 远程控制 Claude Code 的现代化平台，让你在任何设备上使用 Claude Code 的强大功能。**

[English](README.md) | [中文](README_CN.md) | [部署指南](docs/DEPLOYMENT.md)

</div>

---

## ✨ 功能特点

- 🗣️ **远程对话** - 通过 Web 与 Claude Code 进行交互式对话
- 📁 **文件管理** - 使用 Monaco Editor 浏览、编辑、保存远程文件
- 💻 **Web 终端** - 完整的终端体验，支持 PTY
- 🔀 **Git 集成** - 状态查看、提交、推送、分支管理、历史记录
- 📋 **项目模板** - 快速创建各类项目
- 🔌 **插件系统** - 可扩展的功能
- 📱 **移动端适配** - 随时随地使用

## 🖼️ 截图预览

<div align="center">
<img src="docs/images/dashboard.png" alt="仪表板" width="80%">
</div>

## 🚀 快速开始

### 前置要求

- **Node.js** 20+
- **pnpm** 8+
- **Docker**（用于 PostgreSQL 和 Redis）或独立安装的 PostgreSQL
- **Claude Code CLI**（本地 Agent 需要）

### 一键部署（生产环境）

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh docker
```

**Windows:**
```cmd
deploy.bat docker
```

> 详细部署选项请参阅 [部署指南](docs/DEPLOYMENT.md)。

### 一键启动（开发环境）

**Windows:**
```bash
start-dev.bat
```

**Linux/Mac:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

脚本会自动完成：
1. 启动 PostgreSQL 和 Redis（通过 Docker）
2. 安装依赖
3. 构建共享包
4. 初始化数据库
5. 启动 WebSocket 服务器（端口 8080）
6. 启动 Web 应用（端口 3000）

### 手动启动

<details>
<summary>点击展开手动启动说明</summary>

1. **启动数据库:**
```bash
docker run -d --name wcc-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=web_claude_code \
  -p 5432:5432 \
  postgres:15
```

2. **安装依赖:**
```bash
pnpm install
```

3. **配置环境变量:**
```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/ws-server/.env.example apps/ws-server/.env
# 重要：确保 JWT_SECRET 在两个文件中相同！
```

4. **构建共享包:**
```bash
cd packages/shared && pnpm build
```

5. **初始化数据库:**
```bash
cd apps/web
pnpm prisma generate
pnpm prisma db push
```

6. **启动 WebSocket 服务器:**
```bash
cd apps/ws-server && pnpm dev
# 预期输出: WebSocket server running on port 8080
```

7. **启动 Web 应用（新终端）:**
```bash
cd apps/web && pnpm dev
# 预期输出: http://localhost:3000
```

8. **访问应用:**
   - 打开浏览器访问 http://localhost:3000
   - 注册账号并登录

</details>

## 📖 使用教程

### 第一步：注册和登录

1. 打开浏览器访问 `http://localhost:3000`（或你的部署地址）
2. 点击 **注册** 创建新账号
3. 填写邮箱和密码
4. 使用你的凭据登录

### 第二步：创建 Agent

1. 导航到 **控制台** → **Agents**
2. 点击 **创建 Agent**
3. 输入 Agent 名称（例如："我的工作站"）
4. 点击 **创建** - 系统会生成一个密钥
5. **复制并保存密钥**（稍后会用到）

### 第三步：连接本地 Agent

在你想运行 Claude Code 的本地机器上：

```bash
# 进入 agent 目录
cd apps/agent

# 构建 agent
pnpm build

# 使用服务器地址和密钥配置 agent
pnpm start config -s ws://localhost:8080 -k <你的密钥>

# 启动 agent
pnpm start start
```

连接成功后，Web 控制台中 Agent 状态会显示为 **在线**。

### 第四步：开始聊天会话

1. 进入 **控制台** → **会话**
2. 点击 **新建会话**
3. 选择你的在线 Agent
4. 设置工作目录（默认: `/`）
5. 点击 **创建**
6. 开始与 Claude 对话！

### 第五步：使用功能

| 功能 | 如何访问 |
|------|----------|
| **聊天** | 主聊天界面 - 输入消息与 Claude 对话 |
| **文件浏览器** | 点击侧边栏的文件夹图标 |
| **终端** | 点击侧边栏的终端图标 |
| **Git** | 点击侧边栏的 Git 图标 |
| **编辑器** | 在文件浏览器中点击任意文件 |

### 使用技巧

- 使用 **Ctrl+Enter** 发送消息
- 点击代码块上的 **复制** 按钮复制到剪贴板
- 在设置中使用 **主题切换** 切换深色/浅色模式
- **固定** 重要会话以便快速访问

## 🔧 连接你的电脑

有 **两种方式** 将你的本地机器连接到 Web Claude Code：

### 方式一：桌面连接器（推荐新手使用）

**WCC Desktop Connector** 是一个跨平台的 Electron 桌面应用，带有图形界面。

#### 下载

预构建的程序位于 `tools/desktop-connector/release/`：
- **Windows**: `WCC Desktop Connector Setup 1.0.0.exe`（安装版）或便携版
- **macOS/Linux**: 从源码构建（见下方）

#### 使用方法

1. 启动桌面连接器
2. 输入服务器地址（例如：`http://localhost:3000`）
3. 使用你的 Web Claude Code 账号登录
4. 从列表中选择一个 Agent
5. 点击 **连接**

应用会自动：
- 与服务器进行身份验证
- 建立 WebSocket 连接
- 在本地执行 Claude Code 命令
- 将结果流式传输回 Web 界面

#### 从源码构建

```bash
cd tools/desktop-connector

# 安装依赖
npm install

# 开发模式
npm run dev

# 为你的平台构建
npm run package:win    # Windows
npm run package:mac    # macOS
npm run package:linux  # Linux
```

### 方式二：命令行 Agent（适合高级用户）

命令行 Agent 在终端中运行，无需图形界面。

```bash
# 构建 Agent
cd apps/agent && pnpm build

# 配置（从 Web 控制台获取 Secret Key）
pnpm start config -s ws://localhost:8080 -k <your-secret-key>

# 启动 Agent
pnpm start start
```

Agent 成功连接后，Web 端会显示 Agent 在线状态。

### 对比

| 特性 | 桌面连接器 | 命令行 Agent |
|------|-----------|-------------|
| 界面 | 图形界面 (Electron) | 终端 |
| 登录方式 | 邮箱/密码 | Secret Key |
| 设置难度 | 一键连接 | 手动配置 |
| 适合场景 | 新手用户 | 服务器/自动化 |

## 📁 项目结构

```
web-claude-code/
├── apps/
│   ├── web/              # Next.js Web 应用
│   │   ├── src/
│   │   │   ├── app/      # App Router 页面
│   │   │   ├── components/   # React 组件
│   │   │   ├── hooks/    # 自定义 Hooks
│   │   │   ├── lib/      # 工具库
│   │   │   └── stores/   # Zustand 状态管理
│   │   └── prisma/       # 数据库 Schema
│   ├── ws-server/        # WebSocket 服务器
│   │   └── src/
│   │       ├── handlers/ # 消息处理器
│   │       └── services/ # 连接管理
│   └── agent/            # 命令行 Agent
│       └── src/
│           └── handlers/ # 功能处理器
├── tools/
│   └── desktop-connector/    # Electron 桌面应用
│       ├── src/
│       │   ├── main/         # 主进程
│       │   ├── preload/      # 预加载脚本
│       │   └── renderer/     # 界面 (HTML/CSS/JS)
│       └── release/          # 构建好的程序
├── packages/
│   ├── shared/           # 共享类型和工具
│   └── plugin-sdk/       # 插件开发 SDK
├── templates/            # 项目模板
├── plugins/              # 官方插件
└── docs/                 # 文档
```

## 🛠️ 技术栈

| 组件 | 技术 |
|------|------|
| 前端 | Next.js 14, React 18, TypeScript 5.3, Tailwind CSS 3.4 |
| 状态管理 | Zustand 4.5, TanStack Query 5.28 |
| 代码编辑器 | Monaco Editor 0.45 |
| 终端 | xterm.js 5.3 |
| 后端 API | Next.js API Routes |
| WebSocket | ws 8.16 (Node.js) |
| 数据库 | PostgreSQL 15, Prisma 5.22 |
| 缓存 | Redis 7 |
| 认证 | NextAuth.js 4.24 |
| 单体仓库 | Turbo 2.7, pnpm workspaces |
| 命令行 Agent | Node.js, Commander.js, node-pty |
| 桌面连接器 | Electron 27, electron-vite, TypeScript |

## ⚙️ 环境变量

### apps/web/.env.local

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/web_claude_code"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="your-jwt-secret"
ENCRYPTION_KEY="12345678901234567890123456789012"  # 必须32字符
NEXT_PUBLIC_WS_URL="ws://localhost:8080"
```

### apps/ws-server/.env

```env
WS_PORT=8080
JWT_SECRET="your-jwt-secret"  # 必须与 web 端相同
ENCRYPTION_KEY="12345678901234567890123456789012"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/web_claude_code"
```

## 🚢 部署

生产环境部署请参阅 [部署指南](docs/DEPLOYMENT.md)。

快速部署命令：

```bash
# Docker 部署（推荐）
./deploy.sh docker

# 本地构建
./deploy.sh local

# 仅设置环境
./deploy.sh setup

# 创建 PM2 配置
./deploy.sh pm2
```

## 🐛 常见问题

<details>
<summary><b>WebSocket 连接失败</b></summary>

- 检查 `NEXT_PUBLIC_WS_URL` 配置是否正确
- 确认 ws-server 正在运行
- 检查端口是否被占用
</details>

<details>
<summary><b>数据库连接失败</b></summary>

- 确认 PostgreSQL 正在运行
- 检查 `DATABASE_URL` 配置
- 运行 `pnpm prisma db push` 初始化数据库
</details>

<details>
<summary><b>登录后被重定向回登录页</b></summary>

- 检查 `JWT_SECRET` 在 web 和 ws-server 中是否一致
- 清除浏览器 cookies
- 检查 NextAuth 配置
</details>

<details>
<summary><b>Agent 无法连接</b></summary>

- 检查 Secret Key 是否正确
- 确认服务器 URL 格式正确（ws:// 或 wss://）
- 查看 Agent 日志排查问题
</details>

## 🛑 停止服务

**Windows:**
```bash
stop-dev.bat
```

**Linux/Mac:**
按 `Ctrl+C` 停止所有服务。

**Docker:**
```bash
docker compose down
```

## 📝 开发

```bash
# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 清理构建
pnpm clean
```

## 🤝 参与贡献

欢迎贡献代码！请先阅读我们的[贡献指南](CONTRIBUTING.md)。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

## 📄 开源协议

本项目基于 MIT 协议开源 - 详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [Anthropic](https://anthropic.com) 提供的 Claude
- [Claude Code](https://github.com/anthropics/claude-code) CLI
- 所有贡献者和支持者

---

<div align="center">

**如果这个项目对你有帮助，请给它一个 ⭐️**

</div>
