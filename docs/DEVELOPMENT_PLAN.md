# Web Claude Code 远程控制平台 - 完整开发计划

> **重要说明**: 此计划文件将在退出计划模式后移动到项目根目录 `d:\github\Web-Claude code\docs\DEVELOPMENT_PLAN.md`
> 所有开发工作都在项目根目录 `d:\github\Web-Claude code` 中进行，不在C盘创建任何文件。

## 文件存放位置

开发计划相关文件将存放在项目目录：
```
d:\github\Web-Claude code\
├── docs\
│   ├── DEVELOPMENT_PLAN.md          # 完整开发计划（本文件）
│   ├── prompts\
│   │   ├── chat1-foundation.md      # Chat 1 提示词
│   │   ├── chat2-websocket-agent.md # Chat 2 提示词
│   │   ├── chat3-chat-feature.md    # Chat 3 提示词
│   │   ├── chat4-file-editor.md     # Chat 4 提示词
│   │   ├── chat5-terminal-git.md    # Chat 5 提示词
│   │   ├── chat6-template-plugin.md # Chat 6 提示词
│   │   └── chat7-integration.md     # 集成Chat提示词
│   └── api\
│       └── API_REFERENCE.md         # API参考文档
├── .env.example                      # 环境变量示例
├── docker-compose.yml                # Docker编排
└── README.md                         # 项目说明
```

---

## 一、项目概述

### 1.1 项目名称
**Web Claude Code** - 基于Web的Claude Code远程控制平台

### 1.2 项目目标
开发一个功能完整的Web平台，允许用户通过浏览器远程控制本地或服务器上的Claude Code，实现完整的AI辅助开发体验。

### 1.3 核心功能清单

| 功能模块 | 功能点 | 优先级 |
|---------|-------|--------|
| 用户系统 | 注册/登录/JWT认证 | P0 |
| 用户系统 | API Key管理（加密存储） | P0 |
| Agent管理 | 本地Agent连接 | P0 |
| Agent管理 | 服务器共享Agent | P0 |
| 对话功能 | 发送提示词 | P0 |
| 对话功能 | 实时流式输出 | P0 |
| 对话功能 | 会话管理与恢复 | P0 |
| 文件管理 | 文件树浏览 | P0 |
| 文件管理 | 文件编辑（Monaco） | P0 |
| 文件管理 | 目录切换 | P0 |
| 终端操作 | Web终端（xterm.js） | P0 |
| 终端操作 | 命令执行 | P0 |
| Git集成 | 状态显示 | P0 |
| Git集成 | 提交/推送/拉取 | P0 |
| Git集成 | 分支管理 | P0 |
| 历史记录 | 对话历史持久化 | P0 |
| 历史记录 | 搜索与导出 | P0 |
| 项目模板 | 模板库 | P0 |
| 项目模板 | 一键创建项目 | P0 |
| 移动端适配 | 响应式布局 | P0 |
| 移动端适配 | 触摸优化 | P0 |
| 插件系统 | 插件API | P0 |
| 插件系统 | 插件市场 | P0 |

---

## 二、技术架构

### 2.1 技术栈选型

```
┌─────────────────────────────────────────────────────────────┐
│                        技术栈总览                            │
├─────────────────────────────────────────────────────────────┤
│ 前端框架    │ Next.js 14 (App Router) + TypeScript          │
│ UI组件库    │ shadcn/ui + Tailwind CSS + Radix UI           │
│ 状态管理    │ Zustand + React Query (TanStack Query)        │
│ 代码编辑器  │ Monaco Editor (@monaco-editor/react)          │
│ 终端模拟    │ xterm.js + xterm-addon-fit                    │
│ Markdown    │ react-markdown + rehype-highlight             │
│ 实时通信    │ WebSocket (ws) + Socket.io-client             │
├─────────────────────────────────────────────────────────────┤
│ 后端框架    │ Next.js API Routes + 独立WebSocket服务器       │
│ 数据库      │ PostgreSQL + Prisma ORM                       │
│ 缓存        │ Redis (会话、在线状态)                         │
│ 认证        │ NextAuth.js + JWT                             │
│ 加密        │ crypto (AES-256-GCM)                          │
├─────────────────────────────────────────────────────────────┤
│ Agent       │ Node.js + TypeScript                          │
│ CLI解析     │ Commander.js                                  │
│ 进程管理    │ child_process (spawn)                         │
│ 文件监听    │ chokidar                                      │
├─────────────────────────────────────────────────────────────┤
│ 部署        │ Docker + Docker Compose                       │
│ 反向代理    │ Nginx                                         │
│ SSL         │ Let's Encrypt                                 │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 系统架构图

```
                              ┌─────────────────────────────────┐
                              │         云服务器集群             │
┌─────────────┐               │  ┌───────────────────────────┐  │
│   浏览器     │    HTTPS     │  │      Nginx 反向代理        │  │
│  (PC/手机)   │◄────────────►│  └─────────┬─────────────────┘  │
└─────────────┘               │            │                    │
                              │  ┌─────────▼─────────────────┐  │
                              │  │    Next.js Web 应用        │  │
                              │  │  ┌─────────────────────┐  │  │
                              │  │  │   React Frontend    │  │  │
                              │  │  ├─────────────────────┤  │  │
                              │  │  │   API Routes        │  │  │
                              │  │  └─────────────────────┘  │  │
                              │  └─────────┬─────────────────┘  │
                              │            │                    │
                              │  ┌─────────▼─────────────────┐  │
                              │  │   WebSocket Server        │  │
                              │  │   (独立Node.js服务)        │  │
                              │  └─────────┬─────────────────┘  │
                              │            │                    │
                              │  ┌─────────▼─────┐ ┌─────────┐  │
                              │  │  PostgreSQL   │ │  Redis  │  │
                              │  └───────────────┘ └─────────┘  │
                              │            │                    │
                              │  ┌─────────▼─────────────────┐  │
                              │  │   Server Agent (可选)      │  │
                              │  │   服务器共享Claude Code    │  │
                              │  └───────────────────────────┘  │
                              └────────────┬────────────────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │ WebSocket (wss://)   │                      │
                    ▼                      ▼                      ▼
           ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
           │  用户A电脑    │       │  用户B电脑    │       │  用户C电脑    │
           │ ┌──────────┐ │       │ ┌──────────┐ │       │ ┌──────────┐ │
           │ │  Local   │ │       │ │  Local   │ │       │ │  Local   │ │
           │ │  Agent   │ │       │ │  Agent   │ │       │ │  Agent   │ │
           │ └────┬─────┘ │       │ └────┬─────┘ │       │ └────┬─────┘ │
           │      │       │       │      │       │       │      │       │
           │ ┌────▼─────┐ │       │ ┌────▼─────┐ │       │ ┌────▼─────┐ │
           │ │Claude CLI│ │       │ │Claude CLI│ │       │ │Claude CLI│ │
           │ └──────────┘ │       │ └──────────┘ │       │ └──────────┘ │
           │      │       │       │      │       │       │      │       │
           │ ┌────▼─────┐ │       │ ┌────▼─────┐ │       │ ┌────▼─────┐ │
           │ │项目文件夹 │ │       │ │项目文件夹 │ │       │ │项目文件夹 │ │
           │ └──────────┘ │       │ └──────────┘ │       │ └──────────┘ │
           └──────────────┘       └──────────────┘       └──────────────┘
```

---

## 三、项目目录结构

```
web-claude-code/
│
├── pnpm-workspace.yaml              # pnpm工作区配置
├── package.json                     # 根package.json
├── turbo.json                       # Turborepo配置
├── .env.example                     # 环境变量示例
├── docker-compose.yml               # Docker编排
├── docker-compose.dev.yml           # 开发环境Docker
├── README.md                        # 项目说明
│
├── apps/
│   │
│   ├── web/                         # Next.js Web应用
│   │   ├── package.json
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # 数据库模型
│   │   │   └── migrations/          # 数据库迁移
│   │   │
│   │   ├── public/
│   │   │   ├── icons/
│   │   │   └── templates/           # 项目模板文件
│   │   │
│   │   ├── src/
│   │   │   ├── app/                 # Next.js App Router
│   │   │   │   ├── layout.tsx       # 根布局
│   │   │   │   ├── page.tsx         # 首页
│   │   │   │   ├── globals.css      # 全局样式
│   │   │   │   │
│   │   │   │   ├── (auth)/          # 认证路由组
│   │   │   │   │   ├── login/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── register/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── layout.tsx
│   │   │   │   │
│   │   │   │   ├── (dashboard)/     # 主应用路由组
│   │   │   │   │   ├── layout.tsx   # Dashboard布局
│   │   │   │   │   ├── workspace/   # 工作区（主界面）
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── agents/      # Agent管理
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── history/     # 历史记录
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── templates/   # 项目模板
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── plugins/     # 插件市场
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── settings/    # 设置
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   └── api/             # API路由
│   │   │   │       ├── auth/
│   │   │   │       │   ├── [...nextauth]/
│   │   │   │       │   │   └── route.ts
│   │   │   │       │   ├── register/
│   │   │   │       │   │   └── route.ts
│   │   │   │       │   └── api-key/
│   │   │   │       │       └── route.ts
│   │   │   │       │
│   │   │   │       ├── agents/
│   │   │   │       │   ├── route.ts          # GET/POST agents
│   │   │   │       │   └── [id]/
│   │   │   │       │       └── route.ts      # GET/PUT/DELETE agent
│   │   │   │       │
│   │   │   │       ├── sessions/
│   │   │   │       │   ├── route.ts
│   │   │   │       │   └── [id]/
│   │   │   │       │       ├── route.ts
│   │   │   │       │       └── messages/
│   │   │   │       │           └── route.ts
│   │   │   │       │
│   │   │   │       ├── files/
│   │   │   │       │   ├── list/
│   │   │   │       │   │   └── route.ts
│   │   │   │       │   ├── read/
│   │   │   │       │   │   └── route.ts
│   │   │   │       │   └── write/
│   │   │   │       │       └── route.ts
│   │   │   │       │
│   │   │   │       ├── git/
│   │   │   │       │   ├── status/
│   │   │   │       │   │   └── route.ts
│   │   │   │       │   ├── commit/
│   │   │   │       │   │   └── route.ts
│   │   │   │       │   ├── push/
│   │   │   │       │   │   └── route.ts
│   │   │   │       │   ├── pull/
│   │   │   │       │   │   └── route.ts
│   │   │   │       │   └── branches/
│   │   │   │       │       └── route.ts
│   │   │   │       │
│   │   │   │       ├── terminal/
│   │   │   │       │   └── route.ts
│   │   │   │       │
│   │   │   │       ├── templates/
│   │   │   │       │   ├── route.ts
│   │   │   │       │   └── [id]/
│   │   │   │       │       └── route.ts
│   │   │   │       │
│   │   │   │       └── plugins/
│   │   │   │           ├── route.ts
│   │   │   │           └── [id]/
│   │   │   │               └── route.ts
│   │   │   │
│   │   │   ├── components/          # React组件
│   │   │   │   ├── ui/              # shadcn/ui基础组件
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   │   ├── tabs.tsx
│   │   │   │   │   ├── toast.tsx
│   │   │   │   │   ├── tooltip.tsx
│   │   │   │   │   └── ...
│   │   │   │   │
│   │   │   │   ├── layout/          # 布局组件
│   │   │   │   │   ├── header.tsx
│   │   │   │   │   ├── sidebar.tsx
│   │   │   │   │   ├── resizable-panel.tsx
│   │   │   │   │   └── mobile-nav.tsx
│   │   │   │   │
│   │   │   │   ├── chat/            # 对话组件
│   │   │   │   │   ├── chat-container.tsx
│   │   │   │   │   ├── message-list.tsx
│   │   │   │   │   ├── message-item.tsx
│   │   │   │   │   ├── chat-input.tsx
│   │   │   │   │   ├── streaming-message.tsx
│   │   │   │   │   └── session-list.tsx
│   │   │   │   │
│   │   │   │   ├── file-tree/       # 文件树组件
│   │   │   │   │   ├── file-tree.tsx
│   │   │   │   │   ├── file-node.tsx
│   │   │   │   │   ├── folder-node.tsx
│   │   │   │   │   └── file-icons.tsx
│   │   │   │   │
│   │   │   │   ├── editor/          # 代码编辑器
│   │   │   │   │   ├── code-editor.tsx
│   │   │   │   │   ├── editor-tabs.tsx
│   │   │   │   │   └── editor-toolbar.tsx
│   │   │   │   │
│   │   │   │   ├── terminal/        # 终端组件
│   │   │   │   │   ├── terminal.tsx
│   │   │   │   │   └── terminal-toolbar.tsx
│   │   │   │   │
│   │   │   │   ├── git/             # Git组件
│   │   │   │   │   ├── git-panel.tsx
│   │   │   │   │   ├── git-status.tsx
│   │   │   │   │   ├── git-branches.tsx
│   │   │   │   │   ├── git-commit-form.tsx
│   │   │   │   │   └── git-history.tsx
│   │   │   │   │
│   │   │   │   ├── agents/          # Agent管理组件
│   │   │   │   │   ├── agent-list.tsx
│   │   │   │   │   ├── agent-card.tsx
│   │   │   │   │   ├── agent-form.tsx
│   │   │   │   │   └── agent-status.tsx
│   │   │   │   │
│   │   │   │   ├── templates/       # 模板组件
│   │   │   │   │   ├── template-list.tsx
│   │   │   │   │   ├── template-card.tsx
│   │   │   │   │   └── create-project-dialog.tsx
│   │   │   │   │
│   │   │   │   ├── plugins/         # 插件组件
│   │   │   │   │   ├── plugin-list.tsx
│   │   │   │   │   ├── plugin-card.tsx
│   │   │   │   │   └── plugin-settings.tsx
│   │   │   │   │
│   │   │   │   └── common/          # 通用组件
│   │   │   │       ├── loading.tsx
│   │   │   │       ├── error-boundary.tsx
│   │   │   │       └── confirm-dialog.tsx
│   │   │   │
│   │   │   ├── lib/                 # 工具库
│   │   │   │   ├── db.ts            # Prisma客户端
│   │   │   │   ├── auth.ts          # NextAuth配置
│   │   │   │   ├── crypto.ts        # 加密解密
│   │   │   │   ├── websocket.ts     # WebSocket客户端
│   │   │   │   ├── utils.ts         # 通用工具
│   │   │   │   └── constants.ts     # 常量定义
│   │   │   │
│   │   │   ├── hooks/               # React Hooks
│   │   │   │   ├── use-websocket.ts
│   │   │   │   ├── use-agent.ts
│   │   │   │   ├── use-session.ts
│   │   │   │   ├── use-file-tree.ts
│   │   │   │   ├── use-terminal.ts
│   │   │   │   ├── use-git.ts
│   │   │   │   └── use-mobile.ts
│   │   │   │
│   │   │   ├── stores/              # Zustand状态管理
│   │   │   │   ├── auth-store.ts
│   │   │   │   ├── agent-store.ts
│   │   │   │   ├── session-store.ts
│   │   │   │   ├── file-store.ts
│   │   │   │   ├── terminal-store.ts
│   │   │   │   ├── git-store.ts
│   │   │   │   └── ui-store.ts
│   │   │   │
│   │   │   └── types/               # TypeScript类型
│   │   │       ├── api.ts
│   │   │       ├── agent.ts
│   │   │       ├── session.ts
│   │   │       ├── file.ts
│   │   │       ├── git.ts
│   │   │       ├── terminal.ts
│   │   │       ├── plugin.ts
│   │   │       └── websocket.ts
│   │   │
│   │   └── Dockerfile
│   │
│   ├── ws-server/                   # WebSocket服务器
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts             # 入口
│   │   │   ├── server.ts            # WebSocket服务器
│   │   │   ├── handlers/
│   │   │   │   ├── auth.ts          # 认证处理
│   │   │   │   ├── agent.ts         # Agent消息处理
│   │   │   │   ├── client.ts        # 客户端消息处理
│   │   │   │   └── router.ts        # 消息路由
│   │   │   ├── services/
│   │   │   │   ├── connection-manager.ts
│   │   │   │   ├── session-manager.ts
│   │   │   │   └── message-queue.ts
│   │   │   └── utils/
│   │   │       ├── logger.ts
│   │   │       └── validator.ts
│   │   └── Dockerfile
│   │
│   └── agent/                       # 本地Agent
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts             # CLI入口
│       │   ├── agent.ts             # Agent主类
│       │   ├── config.ts            # 配置管理
│       │   ├── websocket.ts         # WebSocket客户端
│       │   ├── handlers/
│       │   │   ├── claude.ts        # Claude CLI调用
│       │   │   ├── file-system.ts   # 文件系统操作
│       │   │   ├── terminal.ts      # 终端命令执行
│       │   │   └── git.ts           # Git操作
│       │   ├── utils/
│       │   │   ├── logger.ts
│       │   │   ├── path-validator.ts
│       │   │   └── process-manager.ts
│       │   └── types/
│       │       └── index.ts
│       ├── bin/
│       │   └── wcc-agent            # CLI可执行文件
│       └── Dockerfile
│
├── packages/
│   │
│   ├── shared/                      # 共享代码包
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── types/               # 共享类型定义
│   │       │   ├── message.ts       # WebSocket消息类型
│   │       │   ├── api.ts           # API响应类型
│   │       │   ├── agent.ts         # Agent类型
│   │       │   └── index.ts
│   │       ├── constants/           # 共享常量
│   │       │   ├── events.ts        # 事件名称
│   │       │   ├── errors.ts        # 错误码
│   │       │   └── index.ts
│   │       └── utils/               # 共享工具函数
│   │           ├── validation.ts
│   │           └── index.ts
│   │
│   ├── ui/                          # UI组件包（可选，用于共享）
│   │   ├── package.json
│   │   └── src/
│   │       └── index.ts
│   │
│   └── plugin-sdk/                  # 插件开发SDK
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── types.ts             # 插件类型定义
│           ├── hooks.ts             # 插件可用的hooks
│           └── api.ts               # 插件API
│
├── templates/                       # 项目模板
│   ├── nextjs-app/
│   │   ├── template.json            # 模板配置
│   │   └── files/                   # 模板文件
│   ├── react-vite/
│   ├── vue-app/
│   ├── express-api/
│   ├── python-fastapi/
│   └── static-html/
│
├── plugins/                         # 官方插件
│   ├── code-review/                 # 代码审查插件
│   ├── test-generator/              # 测试生成插件
│   └── doc-generator/               # 文档生成插件
│
└── docs/                            # 文档
    ├── setup.md                     # 安装指南
    ├── development.md               # 开发指南
    ├── deployment.md                # 部署指南
    ├── api.md                       # API文档
    ├── plugin-development.md        # 插件开发指南
    └── architecture.md              # 架构说明
```

---

## 四、数据库设计

### 4.1 完整Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== 用户相关 ====================

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  passwordHash    String    @map("password_hash")
  name            String?
  avatar          String?
  apiKeyEncrypted String?   @map("api_key_encrypted")  // AES加密的Anthropic API Key
  apiKeyIv        String?   @map("api_key_iv")         // 加密IV
  role            UserRole  @default(USER)
  status          UserStatus @default(ACTIVE)
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  lastLoginAt     DateTime? @map("last_login_at")

  // 关系
  agents          Agent[]
  sessions        Session[]
  templates       Template[]  @relation("UserTemplates")
  plugins         UserPlugin[]

  @@map("users")
}

enum UserRole {
  USER
  ADMIN
}

enum UserStatus {
  ACTIVE
  INACTIVE
  BANNED
}

// ==================== Agent相关 ====================

model Agent {
  id               String      @id @default(cuid())
  userId           String      @map("user_id")
  name             String
  description      String?
  secretKey        String      @unique @map("secret_key")  // Agent连接密钥
  type             AgentType   @default(LOCAL)
  isOnline         Boolean     @default(false) @map("is_online")
  lastSeenAt       DateTime?   @map("last_seen_at")
  currentDirectory String?     @map("current_directory")
  systemInfo       Json?       @map("system_info")  // 系统信息：OS、内存等
  allowedPaths     String[]    @default([]) @map("allowed_paths")  // 允许访问的路径
  createdAt        DateTime    @default(now()) @map("created_at")
  updatedAt        DateTime    @updatedAt @map("updated_at")

  // 关系
  user             User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessions         Session[]

  @@index([userId])
  @@index([secretKey])
  @@map("agents")
}

enum AgentType {
  LOCAL    // 用户本地Agent
  SERVER   // 服务器共享Agent
}

// ==================== 会话相关 ====================

model Session {
  id               String        @id @default(cuid())
  userId           String        @map("user_id")
  agentId          String?       @map("agent_id")
  name             String
  workingDirectory String?       @map("working_directory")
  claudeSessionId  String?       @map("claude_session_id")  // Claude Code的session ID
  status           SessionStatus @default(ACTIVE)
  metadata         Json?         // 其他元数据
  createdAt        DateTime      @default(now()) @map("created_at")
  updatedAt        DateTime      @updatedAt @map("updated_at")

  // 关系
  user             User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  agent            Agent?        @relation(fields: [agentId], references: [id], onDelete: SetNull)
  messages         Message[]

  @@index([userId])
  @@index([agentId])
  @@map("sessions")
}

enum SessionStatus {
  ACTIVE
  ARCHIVED
  DELETED
}

model Message {
  id          String      @id @default(cuid())
  sessionId   String      @map("session_id")
  role        MessageRole
  content     String
  contentType ContentType @default(TEXT) @map("content_type")
  metadata    Json?       // token使用、工具调用等信息
  createdAt   DateTime    @default(now()) @map("created_at")

  // 关系
  session     Session     @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
  @@index([createdAt])
  @@map("messages")
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
  TOOL
}

enum ContentType {
  TEXT
  CODE
  IMAGE
  FILE
  ERROR
}

// ==================== 模板相关 ====================

model Template {
  id          String         @id @default(cuid())
  name        String
  description String?
  category    String
  icon        String?
  author      String?
  authorId    String?        @map("author_id")
  isOfficial  Boolean        @default(false) @map("is_official")
  isPublic    Boolean        @default(true) @map("is_public")
  config      Json           // 模板配置：文件列表、变量等
  downloads   Int            @default(0)
  stars       Int            @default(0)
  version     String         @default("1.0.0")
  createdAt   DateTime       @default(now()) @map("created_at")
  updatedAt   DateTime       @updatedAt @map("updated_at")

  // 关系
  authorUser  User?          @relation("UserTemplates", fields: [authorId], references: [id], onDelete: SetNull)

  @@index([category])
  @@index([isPublic])
  @@map("templates")
}

// ==================== 插件相关 ====================

model Plugin {
  id          String        @id @default(cuid())
  name        String        @unique
  displayName String        @map("display_name")
  description String?
  version     String
  author      String
  icon        String?
  homepage    String?
  repository  String?
  isOfficial  Boolean       @default(false) @map("is_official")
  isActive    Boolean       @default(true) @map("is_active")
  config      Json?         // 插件配置schema
  permissions String[]      @default([])  // 所需权限
  downloads   Int           @default(0)
  rating      Float         @default(0)
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  // 关系
  userPlugins UserPlugin[]

  @@map("plugins")
}

model UserPlugin {
  id          String    @id @default(cuid())
  userId      String    @map("user_id")
  pluginId    String    @map("plugin_id")
  isEnabled   Boolean   @default(true) @map("is_enabled")
  settings    Json?     // 用户的插件配置
  installedAt DateTime  @default(now()) @map("installed_at")

  // 关系
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  plugin      Plugin    @relation(fields: [pluginId], references: [id], onDelete: Cascade)

  @@unique([userId, pluginId])
  @@map("user_plugins")
}

// ==================== 系统配置 ====================

model SystemConfig {
  id        String   @id @default(cuid())
  key       String   @unique
  value     Json
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("system_config")
}
```

---

## 五、WebSocket通信协议

### 5.1 消息类型定义

```typescript
// packages/shared/src/types/message.ts

// ==================== 基础消息结构 ====================

export interface WSMessage<T = unknown> {
  id: string;           // 消息唯一ID
  type: string;         // 消息类型
  payload: T;           // 消息内容
  timestamp: number;    // 时间戳
}

// ==================== 客户端 -> 服务器 ====================

export type ClientToServerMessage =
  | ClientAuthMessage
  | ClientExecuteMessage
  | ClientFileMessage
  | ClientTerminalMessage
  | ClientGitMessage
  | ClientPingMessage;

// 认证消息
export interface ClientAuthMessage extends WSMessage<{
  token: string;  // JWT token
}> {
  type: 'client:auth';
}

// 执行Claude命令
export interface ClientExecuteMessage extends WSMessage<{
  agentId: string;
  sessionId?: string;
  prompt: string;
  workingDirectory?: string;
  options?: {
    maxTurns?: number;
    allowedTools?: string[];
  };
}> {
  type: 'client:execute';
}

// 文件操作
export interface ClientFileMessage extends WSMessage<{
  agentId: string;
  action: 'list' | 'read' | 'write' | 'delete' | 'rename' | 'mkdir';
  path: string;
  content?: string;
  newPath?: string;
}> {
  type: 'client:file';
}

// 终端操作
export interface ClientTerminalMessage extends WSMessage<{
  agentId: string;
  action: 'create' | 'input' | 'resize' | 'close';
  terminalId?: string;
  data?: string;
  cols?: number;
  rows?: number;
}> {
  type: 'client:terminal';
}

// Git操作
export interface ClientGitMessage extends WSMessage<{
  agentId: string;
  action: 'status' | 'commit' | 'push' | 'pull' | 'branch' | 'checkout' | 'log' | 'diff';
  workingDirectory: string;
  params?: Record<string, unknown>;
}> {
  type: 'client:git';
}

// 心跳
export interface ClientPingMessage extends WSMessage<{}> {
  type: 'client:ping';
}

// ==================== 服务器 -> 客户端 ====================

export type ServerToClientMessage =
  | ServerAuthResultMessage
  | ServerStreamMessage
  | ServerCompleteMessage
  | ServerFileResultMessage
  | ServerTerminalOutputMessage
  | ServerGitResultMessage
  | ServerAgentStatusMessage
  | ServerErrorMessage
  | ServerPongMessage;

// 认证结果
export interface ServerAuthResultMessage extends WSMessage<{
  success: boolean;
  userId?: string;
  error?: string;
}> {
  type: 'server:auth_result';
}

// 流式输出
export interface ServerStreamMessage extends WSMessage<{
  sessionId: string;
  content: string;
  contentType: 'text' | 'code' | 'tool_use' | 'tool_result';
  isPartial: boolean;
}> {
  type: 'server:stream';
}

// 执行完成
export interface ServerCompleteMessage extends WSMessage<{
  sessionId: string;
  claudeSessionId: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}> {
  type: 'server:complete';
}

// 文件操作结果
export interface ServerFileResultMessage extends WSMessage<{
  requestId: string;
  success: boolean;
  data?: unknown;
  error?: string;
}> {
  type: 'server:file_result';
}

// 终端输出
export interface ServerTerminalOutputMessage extends WSMessage<{
  terminalId: string;
  data: string;
}> {
  type: 'server:terminal_output';
}

// Git操作结果
export interface ServerGitResultMessage extends WSMessage<{
  requestId: string;
  success: boolean;
  data?: unknown;
  error?: string;
}> {
  type: 'server:git_result';
}

// Agent状态变化
export interface ServerAgentStatusMessage extends WSMessage<{
  agentId: string;
  isOnline: boolean;
  systemInfo?: Record<string, unknown>;
}> {
  type: 'server:agent_status';
}

// 错误消息
export interface ServerErrorMessage extends WSMessage<{
  code: string;
  message: string;
  details?: unknown;
}> {
  type: 'server:error';
}

// 心跳响应
export interface ServerPongMessage extends WSMessage<{}> {
  type: 'server:pong';
}

// ==================== Agent -> 服务器 ====================

export type AgentToServerMessage =
  | AgentAuthMessage
  | AgentResponseMessage
  | AgentStreamMessage
  | AgentFileResultMessage
  | AgentTerminalOutputMessage
  | AgentGitResultMessage
  | AgentStatusMessage
  | AgentPingMessage;

// Agent认证
export interface AgentAuthMessage extends WSMessage<{
  secretKey: string;
  systemInfo: {
    os: string;
    hostname: string;
    username: string;
    homeDir: string;
  };
}> {
  type: 'agent:auth';
}

// Agent响应
export interface AgentResponseMessage extends WSMessage<{
  requestId: string;
  success: boolean;
  data?: unknown;
  error?: string;
}> {
  type: 'agent:response';
}

// Agent流式输出
export interface AgentStreamMessage extends WSMessage<{
  requestId: string;
  content: string;
  contentType: 'text' | 'code' | 'tool_use' | 'tool_result';
  isPartial: boolean;
}> {
  type: 'agent:stream';
}

// 文件操作结果
export interface AgentFileResultMessage extends WSMessage<{
  requestId: string;
  success: boolean;
  data?: unknown;
  error?: string;
}> {
  type: 'agent:file_result';
}

// 终端输出
export interface AgentTerminalOutputMessage extends WSMessage<{
  requestId: string;
  terminalId: string;
  data: string;
}> {
  type: 'agent:terminal_output';
}

// Git结果
export interface AgentGitResultMessage extends WSMessage<{
  requestId: string;
  success: boolean;
  data?: unknown;
  error?: string;
}> {
  type: 'agent:git_result';
}

// Agent状态
export interface AgentStatusMessage extends WSMessage<{
  status: 'ready' | 'busy' | 'error';
  currentTask?: string;
  systemInfo?: Record<string, unknown>;
}> {
  type: 'agent:status';
}

// Agent心跳
export interface AgentPingMessage extends WSMessage<{}> {
  type: 'agent:ping';
}

// ==================== 服务器 -> Agent ====================

export type ServerToAgentMessage =
  | ServerAgentAuthResultMessage
  | ServerAgentExecuteMessage
  | ServerAgentFileMessage
  | ServerAgentTerminalMessage
  | ServerAgentGitMessage
  | ServerAgentPongMessage;

// 认证结果
export interface ServerAgentAuthResultMessage extends WSMessage<{
  success: boolean;
  agentId?: string;
  error?: string;
}> {
  type: 'server:agent_auth_result';
}

// 执行命令
export interface ServerAgentExecuteMessage extends WSMessage<{
  requestId: string;
  sessionId: string;
  prompt: string;
  workingDirectory: string;
  apiKey: string;  // 解密后的API Key
  claudeSessionId?: string;
  options?: {
    maxTurns?: number;
    allowedTools?: string[];
  };
}> {
  type: 'server:execute';
}

// 文件操作
export interface ServerAgentFileMessage extends WSMessage<{
  requestId: string;
  action: 'list' | 'read' | 'write' | 'delete' | 'rename' | 'mkdir';
  path: string;
  content?: string;
  newPath?: string;
}> {
  type: 'server:file';
}

// 终端操作
export interface ServerAgentTerminalMessage extends WSMessage<{
  requestId: string;
  action: 'create' | 'input' | 'resize' | 'close';
  terminalId?: string;
  data?: string;
  cols?: number;
  rows?: number;
}> {
  type: 'server:terminal';
}

// Git操作
export interface ServerAgentGitMessage extends WSMessage<{
  requestId: string;
  action: 'status' | 'commit' | 'push' | 'pull' | 'branch' | 'checkout' | 'log' | 'diff';
  workingDirectory: string;
  params?: Record<string, unknown>;
}> {
  type: 'server:git';
}

// 心跳响应
export interface ServerAgentPongMessage extends WSMessage<{}> {
  type: 'server:pong';
}
```

---

## 六、API接口设计

### 6.1 RESTful API列表

```typescript
// API接口完整列表

// ==================== 认证 ====================
POST   /api/auth/register          // 用户注册
POST   /api/auth/login             // 用户登录
POST   /api/auth/logout            // 用户登出
GET    /api/auth/me                // 获取当前用户信息
PUT    /api/auth/password          // 修改密码
POST   /api/auth/api-key           // 设置API Key
DELETE /api/auth/api-key           // 删除API Key
GET    /api/auth/api-key/status    // 检查API Key状态

// ==================== Agent管理 ====================
GET    /api/agents                 // 获取用户的Agent列表
POST   /api/agents                 // 创建新Agent
GET    /api/agents/:id             // 获取Agent详情
PUT    /api/agents/:id             // 更新Agent
DELETE /api/agents/:id             // 删除Agent
POST   /api/agents/:id/regenerate-key  // 重新生成密钥

// ==================== 会话管理 ====================
GET    /api/sessions               // 获取会话列表
POST   /api/sessions               // 创建新会话
GET    /api/sessions/:id           // 获取会话详情
PUT    /api/sessions/:id           // 更新会话
DELETE /api/sessions/:id           // 删除会话
GET    /api/sessions/:id/messages  // 获取会话消息
POST   /api/sessions/:id/messages  // 添加消息（用于持久化）

// ==================== 文件操作 ====================
POST   /api/files/list             // 列出目录
POST   /api/files/read             // 读取文件
POST   /api/files/write            // 写入文件
POST   /api/files/delete           // 删除文件
POST   /api/files/rename           // 重命名
POST   /api/files/mkdir            // 创建目录
POST   /api/files/search           // 搜索文件

// ==================== Git操作 ====================
POST   /api/git/status             // Git状态
POST   /api/git/diff               // Git diff
POST   /api/git/commit             // 提交
POST   /api/git/push               // 推送
POST   /api/git/pull               // 拉取
POST   /api/git/branches           // 分支列表
POST   /api/git/checkout           // 切换分支
POST   /api/git/log                // 提交历史

// ==================== 终端 ====================
POST   /api/terminal/create        // 创建终端会话
DELETE /api/terminal/:id           // 关闭终端

// ==================== 模板 ====================
GET    /api/templates              // 获取模板列表
GET    /api/templates/:id          // 获取模板详情
POST   /api/templates              // 创建模板（管理员）
PUT    /api/templates/:id          // 更新模板
DELETE /api/templates/:id          // 删除模板
POST   /api/templates/:id/create   // 从模板创建项目

// ==================== 插件 ====================
GET    /api/plugins                // 获取插件列表
GET    /api/plugins/:id            // 获取插件详情
POST   /api/plugins/install        // 安装插件
DELETE /api/plugins/:id/uninstall  // 卸载插件
PUT    /api/plugins/:id/settings   // 更新插件设置
PUT    /api/plugins/:id/toggle     // 启用/禁用插件

// ==================== 系统 ====================
GET    /api/system/health          // 健康检查
GET    /api/system/stats           // 系统统计（管理员）
```

---

## 七、关键组件实现说明

### 7.1 类IDE布局组件

```typescript
// src/app/(dashboard)/workspace/page.tsx
// 主工作区布局：可调整大小的三栏布局

/*
┌──────────────────────────────────────────────────────────────┐
│  Header (Agent选择、用户菜单)                                  │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                  │
│  Sidebar   │  Main Area (可分割)                              │
│            │  ┌─────────────────────┬──────────────────────┐ │
│  - 会话    │  │                     │                      │ │
│  - 文件树  │  │   Chat/Terminal     │   Code Editor        │ │
│  - Git     │  │                     │                      │ │
│  - 模板    │  │                     │                      │ │
│  - 插件    │  │                     │                      │ │
│            │  └─────────────────────┴──────────────────────┘ │
│            │  ┌──────────────────────────────────────────────┤
│            │  │  Bottom Panel (可折叠)                       │
│            │  │  - Terminal / Git Status / Problems          │
│            │  └──────────────────────────────────────────────┤
└────────────┴─────────────────────────────────────────────────┘

移动端布局：
┌──────────────────┐
│  Header + Menu   │
├──────────────────┤
│                  │
│  Tab View        │
│  (Chat/Files/    │
│   Editor/Term)   │
│                  │
├──────────────────┤
│  Bottom Nav      │
└──────────────────┘
*/
```

### 7.2 Agent连接流程

```
用户电脑:                          服务器:

1. 安装Agent
   $ npm install -g wcc-agent

2. 配置Agent
   $ wcc-agent config
   > Server URL: wss://your-server.com/agent
   > Secret Key: xxxxxxxx

3. 启动Agent
   $ wcc-agent start
   │
   ▼
   ┌─────────────────────┐
   │ 读取配置文件         │
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐      WebSocket      ┌─────────────────────┐
   │ 连接WebSocket       │ ─────────────────► │ 接受连接            │
   └──────────┬──────────┘                    └──────────┬──────────┘
              │                                          │
              ▼                                          ▼
   ┌─────────────────────┐                    ┌─────────────────────┐
   │ 发送认证消息         │ ─────────────────► │ 验证Secret Key      │
   │ {secretKey, sysInfo}│                    │ 查询数据库           │
   └──────────┬──────────┘                    └──────────┬──────────┘
              │                                          │
              │                               ◄───────────
              ▼                                          │
   ┌─────────────────────┐                    ┌─────────────────────┐
   │ 收到认证成功         │ ◄──────────────── │ 返回认证结果         │
   │ 开始监听命令         │                    │ 更新Agent在线状态   │
   └──────────┬──────────┘                    └──────────┬──────────┘
              │                                          │
              ▼                                          ▼
   ┌─────────────────────┐                    ┌─────────────────────┐
   │ 定时发送心跳         │ ◄─────────────────►│ 心跳检测            │
   └─────────────────────┘                    └─────────────────────┘
```

### 7.3 Claude CLI调用封装

```typescript
// apps/agent/src/handlers/claude.ts

import { spawn } from 'child_process';
import { EventEmitter } from 'events';

interface ClaudeOptions {
  prompt: string;
  workingDirectory: string;
  apiKey: string;
  sessionId?: string;
  maxTurns?: number;
  allowedTools?: string[];
}

interface StreamChunk {
  type: 'text' | 'code' | 'tool_use' | 'tool_result' | 'complete' | 'error';
  content: string;
  metadata?: Record<string, unknown>;
}

export class ClaudeExecutor extends EventEmitter {
  private process: ReturnType<typeof spawn> | null = null;

  async execute(options: ClaudeOptions): Promise<void> {
    const args = this.buildArgs(options);

    this.process = spawn('claude', args, {
      cwd: options.workingDirectory,
      env: {
        ...process.env,
        ANTHROPIC_API_KEY: options.apiKey,
      },
    });

    let buffer = '';

    this.process.stdout?.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const chunk = this.parseStreamJson(line);
            this.emit('stream', chunk);
          } catch (e) {
            // 非JSON行，可能是普通输出
            this.emit('stream', { type: 'text', content: line });
          }
        }
      }
    });

    this.process.stderr?.on('data', (data) => {
      this.emit('error', data.toString());
    });

    this.process.on('close', (code) => {
      this.emit('complete', { exitCode: code });
    });
  }

  private buildArgs(options: ClaudeOptions): string[] {
    const args = [
      '-p', options.prompt,
      '--output-format', 'stream-json',
    ];

    if (options.sessionId) {
      args.push('--resume', options.sessionId);
    }

    if (options.maxTurns) {
      args.push('--max-turns', options.maxTurns.toString());
    }

    if (options.allowedTools?.length) {
      args.push('--allowedTools', options.allowedTools.join(','));
    }

    return args;
  }

  private parseStreamJson(line: string): StreamChunk {
    const data = JSON.parse(line);
    // 根据Claude Code的stream-json格式解析
    return {
      type: data.type || 'text',
      content: data.content || data.text || '',
      metadata: data,
    };
  }

  abort(): void {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
  }
}
```

---

## 八、开发任务分配（多Chat协同）

为了高效并行开发，将项目分为6个独立的开发模块，每个模块由一个独立的Claude Chat负责。

### 8.1 Chat分配总览

| Chat编号 | 负责模块 | 主要工作 |
|---------|---------|---------|
| Chat 1 | 项目基础 + 用户系统 | 项目初始化、认证、数据库 |
| Chat 2 | WebSocket服务 + Agent | WS服务器、Agent程序 |
| Chat 3 | 对话功能 | 聊天界面、流式输出、会话管理 |
| Chat 4 | 文件管理 + 编辑器 | 文件树、Monaco编辑器 |
| Chat 5 | 终端 + Git | xterm终端、Git操作 |
| Chat 6 | 模板 + 插件 + 移动端 | 项目模板、插件系统、响应式 |

---

## 九、各Chat详细开发提示词

### 9.1 Chat 1 提示词：项目基础 + 用户系统

```markdown
# 任务：Web Claude Code - 项目基础与用户系统

## 项目背景
你正在参与开发一个名为 "Web Claude Code" 的Web平台，该平台允许用户通过浏览器远程控制本地或服务器上的Claude Code CLI进行AI辅助开发。

## 你的职责
你负责**项目基础架构**和**用户认证系统**的开发。

## 工作目录
d:\github\Web-Claude code

## 技术栈
- Next.js 14 (App Router)
- TypeScript
- PostgreSQL + Prisma ORM
- NextAuth.js + JWT
- Tailwind CSS + shadcn/ui
- pnpm (包管理器)
- Turborepo (monorepo管理)

## 详细任务清单

### 阶段1：项目初始化
1. **创建monorepo结构**
   ```bash
   # 创建根目录结构
   mkdir -p apps/web apps/ws-server apps/agent packages/shared packages/plugin-sdk
   ```

2. **初始化pnpm workspace**
   创建 `pnpm-workspace.yaml`:
   ```yaml
   packages:
     - 'apps/*'
     - 'packages/*'
   ```

3. **创建根package.json**
   ```json
   {
     "name": "web-claude-code",
     "private": true,
     "scripts": {
       "dev": "turbo run dev",
       "build": "turbo run build",
       "lint": "turbo run lint",
       "db:push": "pnpm --filter web db:push",
       "db:migrate": "pnpm --filter web db:migrate"
     },
     "devDependencies": {
       "turbo": "^2.0.0",
       "typescript": "^5.3.0"
     }
   }
   ```

4. **创建turbo.json**
   ```json
   {
     "$schema": "https://turbo.build/schema.json",
     "globalDependencies": ["**/.env.*local"],
     "pipeline": {
       "build": {
         "dependsOn": ["^build"],
         "outputs": [".next/**", "!.next/cache/**", "dist/**"]
       },
       "dev": {
         "cache": false,
         "persistent": true
       },
       "lint": {}
     }
   }
   ```

5. **初始化Next.js Web应用 (apps/web)**
   ```bash
   cd apps/web
   pnpm create next-app . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
   ```

6. **安装核心依赖**
   ```bash
   # Web应用依赖
   cd apps/web
   pnpm add @prisma/client next-auth bcryptjs jsonwebtoken zod
   pnpm add -D prisma @types/bcryptjs @types/jsonwebtoken

   # UI依赖
   pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs
   pnpm add @radix-ui/react-toast @radix-ui/react-tooltip
   pnpm add class-variance-authority clsx tailwind-merge lucide-react
   ```

### 阶段2：数据库设置
1. **创建Prisma Schema** (`apps/web/prisma/schema.prisma`)
   - 完整复制开发计划中的Prisma Schema
   - 包含：User, Agent, Session, Message, Template, Plugin, UserPlugin, SystemConfig

2. **配置环境变量** (`apps/web/.env`)
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/web_claude_code"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   JWT_SECRET="your-jwt-secret"
   ENCRYPTION_KEY="32-character-encryption-key-here"
   ```

3. **生成Prisma Client并推送Schema**
   ```bash
   cd apps/web
   pnpm prisma generate
   pnpm prisma db push
   ```

### 阶段3：基础工具库
1. **创建Prisma客户端单例** (`apps/web/src/lib/db.ts`)
   ```typescript
   import { PrismaClient } from '@prisma/client';

   const globalForPrisma = globalThis as unknown as {
     prisma: PrismaClient | undefined;
   };

   export const prisma = globalForPrisma.prisma ?? new PrismaClient();

   if (process.env.NODE_ENV !== 'production') {
     globalForPrisma.prisma = prisma;
   }
   ```

2. **创建加密工具** (`apps/web/src/lib/crypto.ts`)
   ```typescript
   import crypto from 'crypto';

   const ALGORITHM = 'aes-256-gcm';
   const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'utf-8');

   export function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
     const iv = crypto.randomBytes(16);
     const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
     let encrypted = cipher.update(text, 'utf8', 'hex');
     encrypted += cipher.final('hex');
     const tag = cipher.getAuthTag();
     return {
       encrypted,
       iv: iv.toString('hex'),
       tag: tag.toString('hex'),
     };
   }

   export function decrypt(encrypted: string, iv: string, tag: string): string {
     const decipher = crypto.createDecipheriv(
       ALGORITHM,
       KEY,
       Buffer.from(iv, 'hex')
     );
     decipher.setAuthTag(Buffer.from(tag, 'hex'));
     let decrypted = decipher.update(encrypted, 'hex', 'utf8');
     decrypted += decipher.final('utf8');
     return decrypted;
   }
   ```

3. **创建通用工具函数** (`apps/web/src/lib/utils.ts`)
   ```typescript
   import { type ClassValue, clsx } from 'clsx';
   import { twMerge } from 'tailwind-merge';
   import { nanoid } from 'nanoid';

   export function cn(...inputs: ClassValue[]) {
     return twMerge(clsx(inputs));
   }

   export function generateId(prefix?: string): string {
     const id = nanoid(21);
     return prefix ? `${prefix}_${id}` : id;
   }
   ```

### 阶段4：NextAuth配置
1. **创建NextAuth配置** (`apps/web/src/lib/auth.ts`)
   ```typescript
   import { NextAuthOptions } from 'next-auth';
   import CredentialsProvider from 'next-auth/providers/credentials';
   import bcrypt from 'bcryptjs';
   import { prisma } from './db';

   export const authOptions: NextAuthOptions = {
     providers: [
       CredentialsProvider({
         name: 'credentials',
         credentials: {
           email: { label: 'Email', type: 'email' },
           password: { label: 'Password', type: 'password' },
         },
         async authorize(credentials) {
           if (!credentials?.email || !credentials?.password) {
             throw new Error('Missing credentials');
           }

           const user = await prisma.user.findUnique({
             where: { email: credentials.email },
           });

           if (!user) {
             throw new Error('User not found');
           }

           const isValid = await bcrypt.compare(
             credentials.password,
             user.passwordHash
           );

           if (!isValid) {
             throw new Error('Invalid password');
           }

           return {
             id: user.id,
             email: user.email,
             name: user.name,
             role: user.role,
           };
         },
       }),
     ],
     callbacks: {
       async jwt({ token, user }) {
         if (user) {
           token.id = user.id;
           token.role = (user as any).role;
         }
         return token;
       },
       async session({ session, token }) {
         if (session.user) {
           (session.user as any).id = token.id;
           (session.user as any).role = token.role;
         }
         return session;
       },
     },
     pages: {
       signIn: '/login',
     },
     session: {
       strategy: 'jwt',
     },
   };
   ```

2. **创建NextAuth路由** (`apps/web/src/app/api/auth/[...nextauth]/route.ts`)
   ```typescript
   import NextAuth from 'next-auth';
   import { authOptions } from '@/lib/auth';

   const handler = NextAuth(authOptions);
   export { handler as GET, handler as POST };
   ```

### 阶段5：用户API
1. **用户注册API** (`apps/web/src/app/api/auth/register/route.ts`)
   - 验证邮箱格式和密码强度
   - 检查邮箱是否已存在
   - bcrypt加密密码
   - 创建用户记录
   - 返回成功/失败

2. **API Key管理** (`apps/web/src/app/api/auth/api-key/route.ts`)
   - POST: 设置/更新API Key (加密存储)
   - DELETE: 删除API Key
   - GET: 检查API Key是否已设置

3. **Agent管理API** (`apps/web/src/app/api/agents/route.ts`)
   - GET: 获取用户的Agent列表
   - POST: 创建新Agent (生成secretKey)

4. **Agent详情API** (`apps/web/src/app/api/agents/[id]/route.ts`)
   - GET: 获取Agent详情
   - PUT: 更新Agent信息
   - DELETE: 删除Agent

### 阶段6：认证页面
1. **认证布局** (`apps/web/src/app/(auth)/layout.tsx`)
   - 居中卡片布局
   - Logo + 标题

2. **登录页面** (`apps/web/src/app/(auth)/login/page.tsx`)
   - 邮箱/密码表单
   - 使用signIn from next-auth
   - 错误提示
   - 跳转到注册链接

3. **注册页面** (`apps/web/src/app/(auth)/register/page.tsx`)
   - 邮箱/密码/确认密码表单
   - 表单验证
   - 调用注册API
   - 注册成功后跳转登录

### 阶段7：Dashboard布局
1. **Dashboard布局** (`apps/web/src/app/(dashboard)/layout.tsx`)
   - 检查用户登录状态
   - Header组件（用户菜单、Agent选择）
   - Sidebar组件（导航菜单）
   - 主内容区域

2. **创建基础UI组件** (使用shadcn/ui)
   ```bash
   cd apps/web
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add button input card dialog dropdown-menu toast tabs avatar
   ```

3. **Header组件** (`apps/web/src/components/layout/header.tsx`)
   - Logo
   - Agent选择下拉框
   - 用户头像+下拉菜单

4. **Sidebar组件** (`apps/web/src/components/layout/sidebar.tsx`)
   - 导航链接：工作区、Agent管理、历史记录、模板、插件、设置
   - 当前路径高亮

### 输出要求
1. 每个文件使用完整代码，不要省略
2. 包含必要的类型定义
3. 添加适当的错误处理
4. 代码要有清晰的注释
5. 遵循Next.js 14 App Router最佳实践

### 完成标志
当以下条件满足时，你的任务完成：
- [ ] 项目可以通过 `pnpm install` 安装依赖
- [ ] 可以通过 `pnpm dev` 启动开发服务器
- [ ] 数据库Schema可以正常推送
- [ ] 用户可以注册和登录
- [ ] 登录后可以看到Dashboard布局
- [ ] Agent管理API可以正常工作
```

---

### 9.2 Chat 2 提示词：WebSocket服务 + Agent

```markdown
# 任务：Web Claude Code - WebSocket服务器与本地Agent

## 项目背景
你正在参与开发一个名为 "Web Claude Code" 的Web平台。你负责的是**核心通信层**：WebSocket服务器和本地Agent程序。

## 你的职责
1. WebSocket服务器：处理Web客户端和Agent之间的实时通信
2. 本地Agent：运行在用户电脑上，执行Claude CLI命令和文件操作

## 工作目录
d:\github\Web-Claude code

## 技术栈
- Node.js + TypeScript
- ws (WebSocket库)
- Commander.js (CLI)
- child_process (进程管理)
- chokidar (文件监听)

## 前置条件
假设Chat 1已完成：
- monorepo结构已创建
- packages/shared 目录存在
- 数据库已配置

## 详细任务清单

### 阶段1：共享类型包 (packages/shared)

1. **初始化shared包**
   ```bash
   cd packages/shared
   pnpm init
   ```

2. **package.json**
   ```json
   {
     "name": "@wcc/shared",
     "version": "1.0.0",
     "main": "./dist/index.js",
     "types": "./dist/index.d.ts",
     "scripts": {
       "build": "tsc",
       "dev": "tsc --watch"
     }
   }
   ```

3. **创建消息类型** (`packages/shared/src/types/message.ts`)
   - 完整复制开发计划中的WebSocket消息类型定义
   - 包含所有Client/Server/Agent消息类型

4. **创建常量** (`packages/shared/src/constants/events.ts`)
   ```typescript
   export const WS_EVENTS = {
     // Client events
     CLIENT_AUTH: 'client:auth',
     CLIENT_EXECUTE: 'client:execute',
     CLIENT_FILE: 'client:file',
     CLIENT_TERMINAL: 'client:terminal',
     CLIENT_GIT: 'client:git',
     CLIENT_PING: 'client:ping',

     // Server events
     SERVER_AUTH_RESULT: 'server:auth_result',
     SERVER_STREAM: 'server:stream',
     SERVER_COMPLETE: 'server:complete',
     SERVER_FILE_RESULT: 'server:file_result',
     SERVER_TERMINAL_OUTPUT: 'server:terminal_output',
     SERVER_GIT_RESULT: 'server:git_result',
     SERVER_AGENT_STATUS: 'server:agent_status',
     SERVER_ERROR: 'server:error',
     SERVER_PONG: 'server:pong',

     // Agent events
     AGENT_AUTH: 'agent:auth',
     AGENT_STREAM: 'agent:stream',
     AGENT_RESPONSE: 'agent:response',
     AGENT_FILE_RESULT: 'agent:file_result',
     AGENT_TERMINAL_OUTPUT: 'agent:terminal_output',
     AGENT_GIT_RESULT: 'agent:git_result',
     AGENT_STATUS: 'agent:status',
     AGENT_PING: 'agent:ping',
   } as const;
   ```

5. **创建错误码** (`packages/shared/src/constants/errors.ts`)
   ```typescript
   export const ERROR_CODES = {
     AUTH_FAILED: 'AUTH_FAILED',
     AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
     AGENT_OFFLINE: 'AGENT_OFFLINE',
     INVALID_MESSAGE: 'INVALID_MESSAGE',
     EXECUTION_FAILED: 'EXECUTION_FAILED',
     FILE_NOT_FOUND: 'FILE_NOT_FOUND',
     PERMISSION_DENIED: 'PERMISSION_DENIED',
     TIMEOUT: 'TIMEOUT',
   } as const;
   ```

### 阶段2：WebSocket服务器 (apps/ws-server)

1. **初始化ws-server**
   ```bash
   cd apps/ws-server
   pnpm init
   pnpm add ws jsonwebtoken dotenv
   pnpm add -D typescript @types/ws @types/node @types/jsonwebtoken tsx
   ```

2. **package.json**
   ```json
   {
     "name": "@wcc/ws-server",
     "version": "1.0.0",
     "scripts": {
       "dev": "tsx watch src/index.ts",
       "build": "tsc",
       "start": "node dist/index.js"
     },
     "dependencies": {
       "@wcc/shared": "workspace:*",
       "ws": "^8.16.0",
       "jsonwebtoken": "^9.0.0",
       "dotenv": "^16.3.0"
     }
   }
   ```

3. **服务器入口** (`apps/ws-server/src/index.ts`)
   ```typescript
   import { WebSocketServer } from 'ws';
   import { config } from 'dotenv';
   import { ConnectionManager } from './services/connection-manager';
   import { MessageRouter } from './handlers/router';

   config();

   const PORT = process.env.WS_PORT || 8080;

   const wss = new WebSocketServer({ port: Number(PORT) });
   const connectionManager = new ConnectionManager();
   const messageRouter = new MessageRouter(connectionManager);

   wss.on('connection', (ws, req) => {
     const connectionId = connectionManager.addConnection(ws, req);
     console.log(`New connection: ${connectionId}`);

     ws.on('message', (data) => {
       try {
         const message = JSON.parse(data.toString());
         messageRouter.route(connectionId, message);
       } catch (error) {
         console.error('Failed to parse message:', error);
       }
     });

     ws.on('close', () => {
       connectionManager.removeConnection(connectionId);
       console.log(`Connection closed: ${connectionId}`);
     });

     ws.on('error', (error) => {
       console.error(`Connection error ${connectionId}:`, error);
     });
   });

   console.log(`WebSocket server running on port ${PORT}`);
   ```

4. **连接管理器** (`apps/ws-server/src/services/connection-manager.ts`)
   ```typescript
   import { WebSocket } from 'ws';
   import { IncomingMessage } from 'http';
   import { nanoid } from 'nanoid';

   interface Connection {
     id: string;
     ws: WebSocket;
     type: 'client' | 'agent' | 'unknown';
     userId?: string;
     agentId?: string;
     authenticatedAt?: Date;
   }

   export class ConnectionManager {
     private connections = new Map<string, Connection>();
     private userConnections = new Map<string, Set<string>>(); // userId -> connectionIds
     private agentConnections = new Map<string, string>(); // agentId -> connectionId

     addConnection(ws: WebSocket, req: IncomingMessage): string {
       const id = nanoid();
       this.connections.set(id, {
         id,
         ws,
         type: 'unknown',
       });
       return id;
     }

     removeConnection(connectionId: string): void {
       const conn = this.connections.get(connectionId);
       if (conn) {
         if (conn.userId) {
           const userConns = this.userConnections.get(conn.userId);
           userConns?.delete(connectionId);
         }
         if (conn.agentId) {
           this.agentConnections.delete(conn.agentId);
         }
         this.connections.delete(connectionId);
       }
     }

     authenticateClient(connectionId: string, userId: string): void {
       const conn = this.connections.get(connectionId);
       if (conn) {
         conn.type = 'client';
         conn.userId = userId;
         conn.authenticatedAt = new Date();

         if (!this.userConnections.has(userId)) {
           this.userConnections.set(userId, new Set());
         }
         this.userConnections.get(userId)!.add(connectionId);
       }
     }

     authenticateAgent(connectionId: string, agentId: string): void {
       const conn = this.connections.get(connectionId);
       if (conn) {
         conn.type = 'agent';
         conn.agentId = agentId;
         conn.authenticatedAt = new Date();
         this.agentConnections.set(agentId, connectionId);
       }
     }

     getConnection(connectionId: string): Connection | undefined {
       return this.connections.get(connectionId);
     }

     getAgentConnection(agentId: string): Connection | undefined {
       const connectionId = this.agentConnections.get(agentId);
       return connectionId ? this.connections.get(connectionId) : undefined;
     }

     getUserConnections(userId: string): Connection[] {
       const connectionIds = this.userConnections.get(userId);
       if (!connectionIds) return [];
       return Array.from(connectionIds)
         .map(id => this.connections.get(id))
         .filter(Boolean) as Connection[];
     }

     isAgentOnline(agentId: string): boolean {
       return this.agentConnections.has(agentId);
     }

     send(connectionId: string, message: object): void {
       const conn = this.connections.get(connectionId);
       if (conn && conn.ws.readyState === WebSocket.OPEN) {
         conn.ws.send(JSON.stringify(message));
       }
     }

     sendToAgent(agentId: string, message: object): boolean {
       const conn = this.getAgentConnection(agentId);
       if (conn && conn.ws.readyState === WebSocket.OPEN) {
         conn.ws.send(JSON.stringify(message));
         return true;
       }
       return false;
     }

     sendToUser(userId: string, message: object): void {
       const connections = this.getUserConnections(userId);
       for (const conn of connections) {
         if (conn.ws.readyState === WebSocket.OPEN) {
           conn.ws.send(JSON.stringify(message));
         }
       }
     }
   }
   ```

5. **消息路由** (`apps/ws-server/src/handlers/router.ts`)
   ```typescript
   import { ConnectionManager } from '../services/connection-manager';
   import { AuthHandler } from './auth';
   import { ClientHandler } from './client';
   import { AgentHandler } from './agent';
   import { WS_EVENTS } from '@wcc/shared';

   export class MessageRouter {
     private authHandler: AuthHandler;
     private clientHandler: ClientHandler;
     private agentHandler: AgentHandler;

     constructor(private connectionManager: ConnectionManager) {
       this.authHandler = new AuthHandler(connectionManager);
       this.clientHandler = new ClientHandler(connectionManager);
       this.agentHandler = new AgentHandler(connectionManager);
     }

     route(connectionId: string, message: any): void {
       const { type } = message;

       // 认证消息
       if (type === WS_EVENTS.CLIENT_AUTH) {
         this.authHandler.handleClientAuth(connectionId, message);
         return;
       }

       if (type === WS_EVENTS.AGENT_AUTH) {
         this.authHandler.handleAgentAuth(connectionId, message);
         return;
       }

       // 检查连接是否已认证
       const conn = this.connectionManager.getConnection(connectionId);
       if (!conn || conn.type === 'unknown') {
         this.connectionManager.send(connectionId, {
           type: WS_EVENTS.SERVER_ERROR,
           payload: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
         });
         return;
       }

       // 路由到相应处理器
       if (type.startsWith('client:')) {
         this.clientHandler.handle(connectionId, message);
       } else if (type.startsWith('agent:')) {
         this.agentHandler.handle(connectionId, message);
       }
     }
   }
   ```

6. **认证处理** (`apps/ws-server/src/handlers/auth.ts`)
   - handleClientAuth: 验证JWT token
   - handleAgentAuth: 验证Agent secretKey (需要查询数据库)

7. **客户端消息处理** (`apps/ws-server/src/handlers/client.ts`)
   - handleExecute: 转发执行命令到Agent
   - handleFile: 转发文件操作到Agent
   - handleTerminal: 转发终端操作到Agent
   - handleGit: 转发Git操作到Agent

8. **Agent消息处理** (`apps/ws-server/src/handlers/agent.ts`)
   - handleStream: 转发流式输出到客户端
   - handleResponse: 转发响应到客户端
   - handleStatus: 更新Agent状态

### 阶段3：本地Agent (apps/agent)

1. **初始化agent**
   ```bash
   cd apps/agent
   pnpm init
   pnpm add ws commander conf node-pty
   pnpm add -D typescript @types/ws @types/node tsx
   ```

2. **package.json**
   ```json
   {
     "name": "@wcc/agent",
     "version": "1.0.0",
     "bin": {
       "wcc-agent": "./bin/wcc-agent"
     },
     "scripts": {
       "dev": "tsx watch src/index.ts",
       "build": "tsc",
       "start": "node dist/index.js"
     }
   }
   ```

3. **CLI入口** (`apps/agent/src/index.ts`)
   ```typescript
   #!/usr/bin/env node
   import { Command } from 'commander';
   import { Agent } from './agent';
   import { ConfigManager } from './config';

   const program = new Command();

   program
     .name('wcc-agent')
     .description('Web Claude Code Local Agent')
     .version('1.0.0');

   program
     .command('config')
     .description('Configure the agent')
     .action(async () => {
       const config = new ConfigManager();
       await config.interactive();
     });

   program
     .command('start')
     .description('Start the agent')
     .option('-d, --daemon', 'Run as daemon')
     .action(async (options) => {
       const config = new ConfigManager();
       const settings = config.load();

       if (!settings.serverUrl || !settings.secretKey) {
         console.error('Please run "wcc-agent config" first');
         process.exit(1);
       }

       const agent = new Agent(settings);
       await agent.start();
     });

   program
     .command('status')
     .description('Check agent status')
     .action(() => {
       // TODO: 检查agent运行状态
     });

   program.parse();
   ```

4. **配置管理** (`apps/agent/src/config.ts`)
   ```typescript
   import Conf from 'conf';
   import * as readline from 'readline';

   interface AgentConfig {
     serverUrl: string;
     secretKey: string;
     allowedPaths: string[];
   }

   export class ConfigManager {
     private conf: Conf<AgentConfig>;

     constructor() {
       this.conf = new Conf<AgentConfig>({
         projectName: 'wcc-agent',
       });
     }

     load(): Partial<AgentConfig> {
       return {
         serverUrl: this.conf.get('serverUrl'),
         secretKey: this.conf.get('secretKey'),
         allowedPaths: this.conf.get('allowedPaths', []),
       };
     }

     save(config: Partial<AgentConfig>): void {
       Object.entries(config).forEach(([key, value]) => {
         if (value !== undefined) {
           this.conf.set(key as keyof AgentConfig, value);
         }
       });
     }

     async interactive(): Promise<void> {
       const rl = readline.createInterface({
         input: process.stdin,
         output: process.stdout,
       });

       const question = (prompt: string): Promise<string> => {
         return new Promise((resolve) => {
           rl.question(prompt, resolve);
         });
       };

       const serverUrl = await question('Server URL (wss://...): ');
       const secretKey = await question('Secret Key: ');

       this.save({ serverUrl, secretKey });

       console.log('Configuration saved!');
       rl.close();
     }
   }
   ```

5. **Agent主类** (`apps/agent/src/agent.ts`)
   ```typescript
   import WebSocket from 'ws';
   import os from 'os';
   import { ClaudeHandler } from './handlers/claude';
   import { FileSystemHandler } from './handlers/file-system';
   import { TerminalHandler } from './handlers/terminal';
   import { GitHandler } from './handlers/git';
   import { WS_EVENTS } from '@wcc/shared';

   interface AgentConfig {
     serverUrl: string;
     secretKey: string;
     allowedPaths?: string[];
   }

   export class Agent {
     private ws: WebSocket | null = null;
     private reconnectTimer: NodeJS.Timeout | null = null;
     private pingTimer: NodeJS.Timeout | null = null;

     private claudeHandler: ClaudeHandler;
     private fileSystemHandler: FileSystemHandler;
     private terminalHandler: TerminalHandler;
     private gitHandler: GitHandler;

     constructor(private config: AgentConfig) {
       this.claudeHandler = new ClaudeHandler(this.send.bind(this));
       this.fileSystemHandler = new FileSystemHandler(
         this.send.bind(this),
         config.allowedPaths
       );
       this.terminalHandler = new TerminalHandler(this.send.bind(this));
       this.gitHandler = new GitHandler(this.send.bind(this));
     }

     async start(): Promise<void> {
       this.connect();
     }

     private connect(): void {
       console.log(`Connecting to ${this.config.serverUrl}...`);

       this.ws = new WebSocket(this.config.serverUrl);

       this.ws.on('open', () => {
         console.log('Connected to server');
         this.authenticate();
         this.startHeartbeat();
       });

       this.ws.on('message', (data) => {
         try {
           const message = JSON.parse(data.toString());
           this.handleMessage(message);
         } catch (error) {
           console.error('Failed to parse message:', error);
         }
       });

       this.ws.on('close', () => {
         console.log('Disconnected from server');
         this.stopHeartbeat();
         this.scheduleReconnect();
       });

       this.ws.on('error', (error) => {
         console.error('WebSocket error:', error);
       });
     }

     private authenticate(): void {
       this.send({
         type: WS_EVENTS.AGENT_AUTH,
         id: this.generateId(),
         timestamp: Date.now(),
         payload: {
           secretKey: this.config.secretKey,
           systemInfo: {
             os: os.platform(),
             hostname: os.hostname(),
             username: os.userInfo().username,
             homeDir: os.homedir(),
           },
         },
       });
     }

     private handleMessage(message: any): void {
       const { type } = message;

       switch (type) {
         case 'server:agent_auth_result':
           if (message.payload.success) {
             console.log('Authentication successful');
           } else {
             console.error('Authentication failed:', message.payload.error);
             this.ws?.close();
           }
           break;

         case 'server:execute':
           this.claudeHandler.execute(message);
           break;

         case 'server:file':
           this.fileSystemHandler.handle(message);
           break;

         case 'server:terminal':
           this.terminalHandler.handle(message);
           break;

         case 'server:git':
           this.gitHandler.handle(message);
           break;

         case 'server:pong':
           // 心跳响应
           break;

         default:
           console.log('Unknown message type:', type);
       }
     }

     private send(message: object): void {
       if (this.ws && this.ws.readyState === WebSocket.OPEN) {
         this.ws.send(JSON.stringify(message));
       }
     }

     private generateId(): string {
       return Math.random().toString(36).substring(2, 15);
     }

     private startHeartbeat(): void {
       this.pingTimer = setInterval(() => {
         this.send({
           type: WS_EVENTS.AGENT_PING,
           id: this.generateId(),
           timestamp: Date.now(),
           payload: {},
         });
       }, 30000);
     }

     private stopHeartbeat(): void {
       if (this.pingTimer) {
         clearInterval(this.pingTimer);
         this.pingTimer = null;
       }
     }

     private scheduleReconnect(): void {
       if (this.reconnectTimer) return;

       console.log('Reconnecting in 5 seconds...');
       this.reconnectTimer = setTimeout(() => {
         this.reconnectTimer = null;
         this.connect();
       }, 5000);
     }
   }
   ```

6. **Claude处理器** (`apps/agent/src/handlers/claude.ts`)
   - 完整实现ClaudeExecutor类
   - 调用claude CLI，使用stream-json格式
   - 实时转发输出到服务器

7. **文件系统处理器** (`apps/agent/src/handlers/file-system.ts`)
   - list: 列出目录内容
   - read: 读取文件
   - write: 写入文件
   - delete: 删除文件
   - rename: 重命名
   - mkdir: 创建目录
   - 路径安全验证

8. **终端处理器** (`apps/agent/src/handlers/terminal.ts`)
   - 使用node-pty创建伪终端
   - 管理多个终端会话
   - 转发输入输出

9. **Git处理器** (`apps/agent/src/handlers/git.ts`)
   - 执行git命令
   - 解析输出
   - 返回结构化数据

### 输出要求
1. 完整的可运行代码
2. 详细的类型定义
3. 错误处理和日志
4. 重连机制
5. 心跳检测

### 完成标志
- [ ] WebSocket服务器可以启动
- [ ] Agent可以连接到服务器
- [ ] Agent可以成功认证
- [ ] 服务器可以转发消息
- [ ] 心跳机制正常工作
```

---

### 9.3 Chat 3 提示词：对话功能

```markdown
# 任务：Web Claude Code - 对话功能

## 项目背景
你正在参与开发一个名为 "Web Claude Code" 的Web平台。你负责**对话功能**的前端开发。

## 你的职责
1. 聊天界面组件
2. 实时流式输出显示
3. Markdown渲染和代码高亮
4. 会话管理（创建、切换、删除）

## 工作目录
d:\github\Web-Claude code\apps\web

## 技术栈
- React 18 + TypeScript
- Zustand (状态管理)
- react-markdown + rehype-highlight
- WebSocket客户端

## 前置条件
假设已完成：
- 基础项目结构
- 用户认证
- WebSocket服务器

## 详细任务清单

### 阶段1：状态管理

1. **会话Store** (`src/stores/session-store.ts`)
   ```typescript
   import { create } from 'zustand';
   import { persist } from 'zustand/middleware';

   interface Message {
     id: string;
     role: 'user' | 'assistant' | 'system';
     content: string;
     contentType: 'text' | 'code' | 'tool_use' | 'tool_result';
     isStreaming?: boolean;
     createdAt: Date;
   }

   interface Session {
     id: string;
     name: string;
     agentId: string;
     workingDirectory?: string;
     claudeSessionId?: string;
     messages: Message[];
     createdAt: Date;
     updatedAt: Date;
   }

   interface SessionState {
     sessions: Session[];
     currentSessionId: string | null;
     isLoading: boolean;

     // Actions
     createSession: (agentId: string, name?: string) => Session;
     deleteSession: (id: string) => void;
     setCurrentSession: (id: string) => void;
     addMessage: (sessionId: string, message: Omit<Message, 'id' | 'createdAt'>) => void;
     updateMessage: (sessionId: string, messageId: string, content: string) => void;
     appendToMessage: (sessionId: string, messageId: string, content: string) => void;
     setMessageStreaming: (sessionId: string, messageId: string, isStreaming: boolean) => void;
     loadSessions: () => Promise<void>;
   }

   export const useSessionStore = create<SessionState>()(
     persist(
       (set, get) => ({
         sessions: [],
         currentSessionId: null,
         isLoading: false,

         createSession: (agentId, name) => {
           const session: Session = {
             id: crypto.randomUUID(),
             name: name || `Session ${get().sessions.length + 1}`,
             agentId,
             messages: [],
             createdAt: new Date(),
             updatedAt: new Date(),
           };
           set((state) => ({
             sessions: [...state.sessions, session],
             currentSessionId: session.id,
           }));
           return session;
         },

         deleteSession: (id) => {
           set((state) => ({
             sessions: state.sessions.filter((s) => s.id !== id),
             currentSessionId:
               state.currentSessionId === id ? null : state.currentSessionId,
           }));
         },

         setCurrentSession: (id) => {
           set({ currentSessionId: id });
         },

         addMessage: (sessionId, message) => {
           const newMessage: Message = {
             ...message,
             id: crypto.randomUUID(),
             createdAt: new Date(),
           };
           set((state) => ({
             sessions: state.sessions.map((s) =>
               s.id === sessionId
                 ? {
                     ...s,
                     messages: [...s.messages, newMessage],
                     updatedAt: new Date(),
                   }
                 : s
             ),
           }));
           return newMessage.id;
         },

         updateMessage: (sessionId, messageId, content) => {
           set((state) => ({
             sessions: state.sessions.map((s) =>
               s.id === sessionId
                 ? {
                     ...s,
                     messages: s.messages.map((m) =>
                       m.id === messageId ? { ...m, content } : m
                     ),
                   }
                 : s
             ),
           }));
         },

         appendToMessage: (sessionId, messageId, content) => {
           set((state) => ({
             sessions: state.sessions.map((s) =>
               s.id === sessionId
                 ? {
                     ...s,
                     messages: s.messages.map((m) =>
                       m.id === messageId
                         ? { ...m, content: m.content + content }
                         : m
                     ),
                   }
                 : s
             ),
           }));
         },

         setMessageStreaming: (sessionId, messageId, isStreaming) => {
           set((state) => ({
             sessions: state.sessions.map((s) =>
               s.id === sessionId
                 ? {
                     ...s,
                     messages: s.messages.map((m) =>
                       m.id === messageId ? { ...m, isStreaming } : m
                     ),
                   }
                 : s
             ),
           }));
         },

         loadSessions: async () => {
           set({ isLoading: true });
           try {
             const response = await fetch('/api/sessions');
             const sessions = await response.json();
             set({ sessions, isLoading: false });
           } catch (error) {
             console.error('Failed to load sessions:', error);
             set({ isLoading: false });
           }
         },
       }),
       {
         name: 'wcc-sessions',
         partialize: (state) => ({
           currentSessionId: state.currentSessionId,
         }),
       }
     )
   );
   ```

2. **WebSocket Hook** (`src/hooks/use-websocket.ts`)
   ```typescript
   import { useEffect, useRef, useCallback, useState } from 'react';
   import { useSession } from 'next-auth/react';

   interface UseWebSocketOptions {
     onMessage?: (message: any) => void;
     onConnect?: () => void;
     onDisconnect?: () => void;
   }

   export function useWebSocket(options: UseWebSocketOptions = {}) {
     const { data: session } = useSession();
     const wsRef = useRef<WebSocket | null>(null);
     const [isConnected, setIsConnected] = useState(false);
     const [isConnecting, setIsConnecting] = useState(false);

     const connect = useCallback(() => {
       if (wsRef.current || !session?.user) return;

       setIsConnecting(true);
       const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
       const ws = new WebSocket(wsUrl);

       ws.onopen = () => {
         // 发送认证消息
         ws.send(JSON.stringify({
           type: 'client:auth',
           id: crypto.randomUUID(),
           timestamp: Date.now(),
           payload: {
             token: (session as any).accessToken,
           },
         }));
       };

       ws.onmessage = (event) => {
         try {
           const message = JSON.parse(event.data);

           if (message.type === 'server:auth_result') {
             if (message.payload.success) {
               setIsConnected(true);
               setIsConnecting(false);
               options.onConnect?.();
             } else {
               console.error('WebSocket auth failed:', message.payload.error);
               ws.close();
             }
             return;
           }

           options.onMessage?.(message);
         } catch (error) {
           console.error('Failed to parse WebSocket message:', error);
         }
       };

       ws.onclose = () => {
         setIsConnected(false);
         setIsConnecting(false);
         wsRef.current = null;
         options.onDisconnect?.();

         // 自动重连
         setTimeout(() => {
           if (session?.user) {
             connect();
           }
         }, 5000);
       };

       ws.onerror = (error) => {
         console.error('WebSocket error:', error);
       };

       wsRef.current = ws;
     }, [session, options]);

     const disconnect = useCallback(() => {
       if (wsRef.current) {
         wsRef.current.close();
         wsRef.current = null;
       }
     }, []);

     const send = useCallback((message: object) => {
       if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
         wsRef.current.send(JSON.stringify({
           ...message,
           id: (message as any).id || crypto.randomUUID(),
           timestamp: Date.now(),
         }));
       }
     }, []);

     useEffect(() => {
       if (session?.user) {
         connect();
       }
       return () => {
         disconnect();
       };
     }, [session, connect, disconnect]);

     return {
       isConnected,
       isConnecting,
       send,
       connect,
       disconnect,
     };
   }
   ```

### 阶段2：聊天组件

1. **聊天容器** (`src/components/chat/chat-container.tsx`)
   - 集成WebSocket
   - 管理发送和接收消息
   - 处理流式输出

2. **消息列表** (`src/components/chat/message-list.tsx`)
   - 虚拟滚动（大量消息时）
   - 自动滚动到底部
   - 加载更多历史

3. **消息项** (`src/components/chat/message-item.tsx`)
   - 区分用户/助手消息
   - 显示时间戳
   - 复制按钮
   - 消息操作菜单

4. **流式消息** (`src/components/chat/streaming-message.tsx`)
   - 打字机效果
   - 光标闪烁
   - 支持中断

5. **Markdown渲染** (`src/components/chat/markdown-renderer.tsx`)
   ```typescript
   import ReactMarkdown from 'react-markdown';
   import rehypeHighlight from 'rehype-highlight';
   import remarkGfm from 'remark-gfm';
   import { cn } from '@/lib/utils';

   interface MarkdownRendererProps {
     content: string;
     className?: string;
   }

   export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
     return (
       <ReactMarkdown
         className={cn('prose prose-sm dark:prose-invert max-w-none', className)}
         remarkPlugins={[remarkGfm]}
         rehypePlugins={[rehypeHighlight]}
         components={{
           pre: ({ children, ...props }) => (
             <div className="relative group">
               <pre {...props} className="overflow-x-auto p-4 rounded-lg bg-gray-900">
                 {children}
               </pre>
               <button
                 className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                 onClick={() => {
                   // 复制代码
                 }}
               >
                 复制
               </button>
             </div>
           ),
           code: ({ inline, className, children, ...props }) => {
             if (inline) {
               return (
                 <code className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700" {...props}>
                   {children}
                 </code>
               );
             }
             return <code className={className} {...props}>{children}</code>;
           },
         }}
       >
         {content}
       </ReactMarkdown>
     );
   }
   ```

6. **聊天输入** (`src/components/chat/chat-input.tsx`)
   - 多行文本框
   - Shift+Enter换行
   - Enter发送
   - 发送按钮
   - 停止生成按钮

7. **会话列表** (`src/components/chat/session-list.tsx`)
   - 显示所有会话
   - 当前会话高亮
   - 新建会话按钮
   - 删除会话

### 阶段3：API接口

1. **会话API** (`src/app/api/sessions/route.ts`)
   - GET: 获取用户会话列表
   - POST: 创建新会话

2. **会话详情API** (`src/app/api/sessions/[id]/route.ts`)
   - GET: 获取会话详情（包含消息）
   - PUT: 更新会话
   - DELETE: 删除会话

3. **消息API** (`src/app/api/sessions/[id]/messages/route.ts`)
   - GET: 获取会话消息（分页）
   - POST: 保存消息

### 阶段4：工作区集成

1. **工作区页面** (`src/app/(dashboard)/workspace/page.tsx`)
   - 集成聊天组件
   - Agent选择
   - 工作目录选择

### 输出要求
1. 完整的React组件代码
2. 类型安全
3. 错误处理
4. 加载状态
5. 响应式设计

### 完成标志
- [ ] 可以创建和切换会话
- [ ] 可以发送消息
- [ ] 可以实时显示流式响应
- [ ] Markdown和代码正确渲染
- [ ] 会话可以持久化
```

---

### 9.4 Chat 4 提示词：文件管理 + 编辑器

```markdown
# 任务：Web Claude Code - 文件管理与代码编辑器

## 项目背景
你正在参与开发一个名为 "Web Claude Code" 的Web平台。你负责**文件管理**和**代码编辑器**功能。

## 你的职责
1. 文件树组件（浏览、展开/折叠）
2. 文件图标
3. Monaco编辑器集成
4. 文件读写操作
5. 目录切换

## 工作目录
d:\github\Web-Claude code\apps\web

## 技术栈
- React 18 + TypeScript
- @monaco-editor/react
- Zustand (状态管理)
- lucide-react (图标)

## 详细任务清单

### 阶段1：状态管理

1. **文件Store** (`src/stores/file-store.ts`)
   ```typescript
   import { create } from 'zustand';

   interface FileNode {
     name: string;
     path: string;
     type: 'file' | 'directory';
     children?: FileNode[];
     isLoading?: boolean;
     isExpanded?: boolean;
   }

   interface OpenFile {
     path: string;
     name: string;
     content: string;
     language: string;
     isDirty: boolean;
     originalContent: string;
   }

   interface FileState {
     rootPath: string;
     tree: FileNode[];
     openFiles: OpenFile[];
     activeFilePath: string | null;
     isLoading: boolean;

     // Actions
     setRootPath: (path: string) => void;
     setTree: (tree: FileNode[]) => void;
     toggleExpand: (path: string) => void;
     setChildren: (path: string, children: FileNode[]) => void;
     openFile: (file: OpenFile) => void;
     closeFile: (path: string) => void;
     setActiveFile: (path: string) => void;
     updateFileContent: (path: string, content: string) => void;
     markFileSaved: (path: string) => void;
   }

   export const useFileStore = create<FileState>((set, get) => ({
     rootPath: '',
     tree: [],
     openFiles: [],
     activeFilePath: null,
     isLoading: false,

     setRootPath: (path) => set({ rootPath: path }),

     setTree: (tree) => set({ tree }),

     toggleExpand: (path) => {
       set((state) => ({
         tree: toggleNodeExpand(state.tree, path),
       }));
     },

     setChildren: (path, children) => {
       set((state) => ({
         tree: setNodeChildren(state.tree, path, children),
       }));
     },

     openFile: (file) => {
       set((state) => {
         const exists = state.openFiles.some((f) => f.path === file.path);
         if (exists) {
           return { activeFilePath: file.path };
         }
         return {
           openFiles: [...state.openFiles, file],
           activeFilePath: file.path,
         };
       });
     },

     closeFile: (path) => {
       set((state) => {
         const newOpenFiles = state.openFiles.filter((f) => f.path !== path);
         const newActivePath =
           state.activeFilePath === path
             ? newOpenFiles[newOpenFiles.length - 1]?.path || null
             : state.activeFilePath;
         return {
           openFiles: newOpenFiles,
           activeFilePath: newActivePath,
         };
       });
     },

     setActiveFile: (path) => set({ activeFilePath: path }),

     updateFileContent: (path, content) => {
       set((state) => ({
         openFiles: state.openFiles.map((f) =>
           f.path === path
             ? { ...f, content, isDirty: content !== f.originalContent }
             : f
         ),
       }));
     },

     markFileSaved: (path) => {
       set((state) => ({
         openFiles: state.openFiles.map((f) =>
           f.path === path
             ? { ...f, isDirty: false, originalContent: f.content }
             : f
         ),
       }));
     },
   }));

   // Helper functions
   function toggleNodeExpand(tree: FileNode[], path: string): FileNode[] {
     return tree.map((node) => {
       if (node.path === path) {
         return { ...node, isExpanded: !node.isExpanded };
       }
       if (node.children) {
         return { ...node, children: toggleNodeExpand(node.children, path) };
       }
       return node;
     });
   }

   function setNodeChildren(
     tree: FileNode[],
     path: string,
     children: FileNode[]
   ): FileNode[] {
     return tree.map((node) => {
       if (node.path === path) {
         return { ...node, children, isLoading: false };
       }
       if (node.children) {
         return { ...node, children: setNodeChildren(node.children, path, children) };
       }
       return node;
     });
   }
   ```

### 阶段2：文件树组件

1. **文件树** (`src/components/file-tree/file-tree.tsx`)
   - 递归渲染
   - 懒加载子目录
   - 右键菜单

2. **文件节点** (`src/components/file-tree/file-node.tsx`)
   - 点击打开文件
   - 文件图标
   - 文件名

3. **文件夹节点** (`src/components/file-tree/folder-node.tsx`)
   - 展开/折叠
   - 加载指示器
   - 文件夹图标

4. **文件图标** (`src/components/file-tree/file-icons.tsx`)
   ```typescript
   import {
     FileCode,
     FileJson,
     FileText,
     File,
     Folder,
     FolderOpen,
   } from 'lucide-react';

   const FILE_ICONS: Record<string, React.ComponentType<any>> = {
     '.ts': FileCode,
     '.tsx': FileCode,
     '.js': FileCode,
     '.jsx': FileCode,
     '.json': FileJson,
     '.md': FileText,
     '.txt': FileText,
     // 添加更多...
   };

   export function getFileIcon(filename: string, isDirectory: boolean, isOpen?: boolean) {
     if (isDirectory) {
       return isOpen ? FolderOpen : Folder;
     }

     const ext = filename.slice(filename.lastIndexOf('.'));
     return FILE_ICONS[ext] || File;
   }
   ```

5. **目录选择器** (`src/components/file-tree/directory-picker.tsx`)
   - 显示当前目录
   - 路径输入
   - 切换目录按钮

### 阶段3：代码编辑器

1. **编辑器组件** (`src/components/editor/code-editor.tsx`)
   ```typescript
   'use client';

   import { useRef, useEffect } from 'react';
   import Editor, { OnMount, OnChange } from '@monaco-editor/react';
   import { useFileStore } from '@/stores/file-store';

   interface CodeEditorProps {
     className?: string;
   }

   export function CodeEditor({ className }: CodeEditorProps) {
     const { openFiles, activeFilePath, updateFileContent } = useFileStore();
     const editorRef = useRef<any>(null);

     const activeFile = openFiles.find((f) => f.path === activeFilePath);

     const handleEditorMount: OnMount = (editor, monaco) => {
       editorRef.current = editor;

       // 配置编辑器
       editor.updateOptions({
         minimap: { enabled: true },
         fontSize: 14,
         tabSize: 2,
         wordWrap: 'on',
         automaticLayout: true,
       });

       // 快捷键
       editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
         // 保存文件
         handleSave();
       });
     };

     const handleChange: OnChange = (value) => {
       if (activeFilePath && value !== undefined) {
         updateFileContent(activeFilePath, value);
       }
     };

     const handleSave = async () => {
       if (!activeFile) return;
       // TODO: 调用保存API
     };

     if (!activeFile) {
       return (
         <div className="flex items-center justify-center h-full text-gray-500">
           选择一个文件开始编辑
         </div>
       );
     }

     return (
       <Editor
         className={className}
         height="100%"
         language={activeFile.language}
         value={activeFile.content}
         theme="vs-dark"
         onMount={handleEditorMount}
         onChange={handleChange}
         options={{
           readOnly: false,
         }}
       />
     );
   }
   ```

2. **编辑器标签页** (`src/components/editor/editor-tabs.tsx`)
   - 显示打开的文件
   - 切换文件
   - 关闭文件
   - 未保存指示器

3. **编辑器工具栏** (`src/components/editor/editor-toolbar.tsx`)
   - 保存按钮
   - 格式化按钮
   - 查找替换

### 阶段4：文件API

1. **通过WebSocket操作文件**
   - 发送文件操作请求
   - 接收结果

2. **文件Hook** (`src/hooks/use-file-operations.ts`)
   ```typescript
   import { useWebSocket } from './use-websocket';
   import { useFileStore } from '@/stores/file-store';
   import { useAgentStore } from '@/stores/agent-store';

   export function useFileOperations() {
     const { send } = useWebSocket();
     const { currentAgentId } = useAgentStore();
     const { setTree, setChildren, openFile } = useFileStore();

     const listDirectory = async (path: string) => {
       send({
         type: 'client:file',
         payload: {
           agentId: currentAgentId,
           action: 'list',
           path,
         },
       });
     };

     const readFile = async (path: string) => {
       send({
         type: 'client:file',
         payload: {
           agentId: currentAgentId,
           action: 'read',
           path,
         },
       });
     };

     const writeFile = async (path: string, content: string) => {
       send({
         type: 'client:file',
         payload: {
           agentId: currentAgentId,
           action: 'write',
           path,
           content,
         },
       });
     };

     const deleteFile = async (path: string) => {
       send({
         type: 'client:file',
         payload: {
           agentId: currentAgentId,
           action: 'delete',
           path,
         },
       });
     };

     const renameFile = async (path: string, newPath: string) => {
       send({
         type: 'client:file',
         payload: {
           agentId: currentAgentId,
           action: 'rename',
           path,
           newPath,
         },
       });
     };

     const createDirectory = async (path: string) => {
       send({
         type: 'client:file',
         payload: {
           agentId: currentAgentId,
           action: 'mkdir',
           path,
         },
       });
     };

     return {
       listDirectory,
       readFile,
       writeFile,
       deleteFile,
       renameFile,
       createDirectory,
     };
   }
   ```

### 阶段5：语言检测

1. **语言映射** (`src/lib/language-detection.ts`)
   ```typescript
   const EXTENSION_TO_LANGUAGE: Record<string, string> = {
     '.ts': 'typescript',
     '.tsx': 'typescript',
     '.js': 'javascript',
     '.jsx': 'javascript',
     '.json': 'json',
     '.html': 'html',
     '.css': 'css',
     '.scss': 'scss',
     '.less': 'less',
     '.md': 'markdown',
     '.py': 'python',
     '.java': 'java',
     '.go': 'go',
     '.rs': 'rust',
     '.c': 'c',
     '.cpp': 'cpp',
     '.h': 'c',
     '.hpp': 'cpp',
     '.rb': 'ruby',
     '.php': 'php',
     '.sql': 'sql',
     '.yaml': 'yaml',
     '.yml': 'yaml',
     '.xml': 'xml',
     '.sh': 'shell',
     '.bash': 'shell',
     '.zsh': 'shell',
     '.dockerfile': 'dockerfile',
     '.gitignore': 'plaintext',
     '.env': 'plaintext',
   };

   export function detectLanguage(filename: string): string {
     const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
     return EXTENSION_TO_LANGUAGE[ext] || 'plaintext';
   }
   ```

### 输出要求
1. 完整的组件代码
2. 类型安全
3. 性能优化（懒加载、虚拟滚动）
4. 错误处理
5. 加载状态

### 完成标志
- [ ] 文件树可以正常显示
- [ ] 可以展开/折叠目录
- [ ] 可以打开文件到编辑器
- [ ] 编辑器正确高亮代码
- [ ] 可以保存文件
- [ ] 可以切换工作目录
```

---

### 9.5 Chat 5 提示词：终端 + Git

```markdown
# 任务：Web Claude Code - Web终端与Git集成

## 项目背景
你正在参与开发一个名为 "Web Claude Code" 的Web平台。你负责**Web终端**和**Git集成**功能。

## 你的职责
1. xterm.js终端组件
2. 终端输入输出
3. Git状态显示
4. Git操作（commit, push, pull, branch等）
5. Git历史查看

## 工作目录
d:\github\Web-Claude code\apps\web

## 技术栈
- React 18 + TypeScript
- xterm.js + xterm-addon-fit + xterm-addon-web-links
- Zustand (状态管理)

## 详细任务清单

### 阶段1：终端状态管理

1. **终端Store** (`src/stores/terminal-store.ts`)
   ```typescript
   import { create } from 'zustand';

   interface TerminalSession {
     id: string;
     name: string;
     isActive: boolean;
   }

   interface TerminalState {
     sessions: TerminalSession[];
     activeSessionId: string | null;

     createSession: () => TerminalSession;
     closeSession: (id: string) => void;
     setActiveSession: (id: string) => void;
   }

   export const useTerminalStore = create<TerminalState>((set, get) => ({
     sessions: [],
     activeSessionId: null,

     createSession: () => {
       const session: TerminalSession = {
         id: crypto.randomUUID(),
         name: `Terminal ${get().sessions.length + 1}`,
         isActive: true,
       };
       set((state) => ({
         sessions: [...state.sessions, session],
         activeSessionId: session.id,
       }));
       return session;
     },

     closeSession: (id) => {
       set((state) => {
         const newSessions = state.sessions.filter((s) => s.id !== id);
         return {
           sessions: newSessions,
           activeSessionId:
             state.activeSessionId === id
               ? newSessions[newSessions.length - 1]?.id || null
               : state.activeSessionId,
         };
       });
     },

     setActiveSession: (id) => set({ activeSessionId: id }),
   }));
   ```

### 阶段2：终端组件

1. **终端组件** (`src/components/terminal/terminal.tsx`)
   ```typescript
   'use client';

   import { useEffect, useRef } from 'react';
   import { Terminal as XTerm } from 'xterm';
   import { FitAddon } from 'xterm-addon-fit';
   import { WebLinksAddon } from 'xterm-addon-web-links';
   import 'xterm/css/xterm.css';
   import { useWebSocket } from '@/hooks/use-websocket';
   import { useAgentStore } from '@/stores/agent-store';

   interface TerminalProps {
     sessionId: string;
     className?: string;
   }

   export function Terminal({ sessionId, className }: TerminalProps) {
     const containerRef = useRef<HTMLDivElement>(null);
     const terminalRef = useRef<XTerm | null>(null);
     const fitAddonRef = useRef<FitAddon | null>(null);
     const { send, onMessage } = useWebSocket();
     const { currentAgentId } = useAgentStore();

     useEffect(() => {
       if (!containerRef.current) return;

       // 创建终端实例
       const terminal = new XTerm({
         cursorBlink: true,
         fontSize: 14,
         fontFamily: 'Menlo, Monaco, "Courier New", monospace',
         theme: {
           background: '#1e1e1e',
           foreground: '#d4d4d4',
           cursor: '#d4d4d4',
           selectionBackground: '#264f78',
         },
       });

       const fitAddon = new FitAddon();
       const webLinksAddon = new WebLinksAddon();

       terminal.loadAddon(fitAddon);
       terminal.loadAddon(webLinksAddon);

       terminal.open(containerRef.current);
       fitAddon.fit();

       terminalRef.current = terminal;
       fitAddonRef.current = fitAddon;

       // 监听终端输入
       terminal.onData((data) => {
         send({
           type: 'client:terminal',
           payload: {
             agentId: currentAgentId,
             action: 'input',
             terminalId: sessionId,
             data,
           },
         });
       });

       // 监听窗口大小变化
       const handleResize = () => {
         fitAddon.fit();
         send({
           type: 'client:terminal',
           payload: {
             agentId: currentAgentId,
             action: 'resize',
             terminalId: sessionId,
             cols: terminal.cols,
             rows: terminal.rows,
           },
         });
       };

       window.addEventListener('resize', handleResize);

       // 创建终端会话
       send({
         type: 'client:terminal',
         payload: {
           agentId: currentAgentId,
           action: 'create',
           terminalId: sessionId,
           cols: terminal.cols,
           rows: terminal.rows,
         },
       });

       return () => {
         window.removeEventListener('resize', handleResize);
         terminal.dispose();

         // 关闭终端会话
         send({
           type: 'client:terminal',
           payload: {
             agentId: currentAgentId,
             action: 'close',
             terminalId: sessionId,
           },
         });
       };
     }, [sessionId, currentAgentId, send]);

     // 处理终端输出
     useEffect(() => {
       const unsubscribe = onMessage((message) => {
         if (
           message.type === 'server:terminal_output' &&
           message.payload.terminalId === sessionId
         ) {
           terminalRef.current?.write(message.payload.data);
         }
       });

       return unsubscribe;
     }, [sessionId, onMessage]);

     return (
       <div ref={containerRef} className={className} style={{ height: '100%' }} />
     );
   }
   ```

2. **终端标签页** (`src/components/terminal/terminal-tabs.tsx`)
   - 显示终端会话列表
   - 切换终端
   - 新建终端按钮
   - 关闭终端按钮

3. **终端工具栏** (`src/components/terminal/terminal-toolbar.tsx`)
   - 清屏按钮
   - 分割终端
   - 全屏按钮

### 阶段3：Git状态管理

1. **Git Store** (`src/stores/git-store.ts`)
   ```typescript
   import { create } from 'zustand';

   interface GitFile {
     path: string;
     status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';
     staged: boolean;
   }

   interface GitBranch {
     name: string;
     isCurrent: boolean;
     isRemote: boolean;
     lastCommit?: string;
   }

   interface GitCommit {
     hash: string;
     shortHash: string;
     message: string;
     author: string;
     date: Date;
   }

   interface GitState {
     isRepository: boolean;
     currentBranch: string;
     files: GitFile[];
     branches: GitBranch[];
     commits: GitCommit[];
     isLoading: boolean;
     error: string | null;

     setIsRepository: (value: boolean) => void;
     setCurrentBranch: (branch: string) => void;
     setFiles: (files: GitFile[]) => void;
     setBranches: (branches: GitBranch[]) => void;
     setCommits: (commits: GitCommit[]) => void;
     setLoading: (loading: boolean) => void;
     setError: (error: string | null) => void;
   }

   export const useGitStore = create<GitState>((set) => ({
     isRepository: false,
     currentBranch: '',
     files: [],
     branches: [],
     commits: [],
     isLoading: false,
     error: null,

     setIsRepository: (value) => set({ isRepository: value }),
     setCurrentBranch: (branch) => set({ currentBranch: branch }),
     setFiles: (files) => set({ files }),
     setBranches: (branches) => set({ branches }),
     setCommits: (commits) => set({ commits }),
     setLoading: (loading) => set({ isLoading: loading }),
     setError: (error) => set({ error }),
   }));
   ```

### 阶段4：Git组件

1. **Git面板** (`src/components/git/git-panel.tsx`)
   - 集成所有Git功能
   - 标签页切换

2. **Git状态** (`src/components/git/git-status.tsx`)
   - 显示修改的文件
   - 暂存/取消暂存
   - 文件差异预览

3. **分支管理** (`src/components/git/git-branches.tsx`)
   - 分支列表
   - 当前分支高亮
   - 切换分支
   - 创建分支
   - 删除分支

4. **提交表单** (`src/components/git/git-commit-form.tsx`)
   - 提交信息输入
   - 暂存文件列表
   - 提交按钮

5. **提交历史** (`src/components/git/git-history.tsx`)
   - 提交列表
   - 提交详情
   - 查看差异

6. **差异查看器** (`src/components/git/git-diff-viewer.tsx`)
   - 使用Monaco diff editor
   - 显示文件变更

### 阶段5：Git Hook

1. **Git操作Hook** (`src/hooks/use-git.ts`)
   ```typescript
   import { useWebSocket } from './use-websocket';
   import { useGitStore } from '@/stores/git-store';
   import { useAgentStore } from '@/stores/agent-store';
   import { useFileStore } from '@/stores/file-store';
   import { useCallback, useEffect } from 'react';

   export function useGit() {
     const { send, onMessage } = useWebSocket();
     const { currentAgentId } = useAgentStore();
     const { rootPath } = useFileStore();
     const {
       setIsRepository,
       setCurrentBranch,
       setFiles,
       setBranches,
       setCommits,
       setLoading,
       setError,
     } = useGitStore();

     const sendGitCommand = useCallback(
       (action: string, params?: Record<string, unknown>) => {
         send({
           type: 'client:git',
           payload: {
             agentId: currentAgentId,
             action,
             workingDirectory: rootPath,
             params,
           },
         });
       },
       [send, currentAgentId, rootPath]
     );

     const getStatus = useCallback(() => {
       setLoading(true);
       sendGitCommand('status');
     }, [sendGitCommand, setLoading]);

     const getBranches = useCallback(() => {
       sendGitCommand('branch');
     }, [sendGitCommand]);

     const getLog = useCallback((limit = 50) => {
       sendGitCommand('log', { limit });
     }, [sendGitCommand]);

     const getDiff = useCallback((path?: string) => {
       sendGitCommand('diff', { path });
     }, [sendGitCommand]);

     const commit = useCallback(
       (message: string) => {
         sendGitCommand('commit', { message });
       },
       [sendGitCommand]
     );

     const push = useCallback(
       (remote = 'origin', branch?: string) => {
         sendGitCommand('push', { remote, branch });
       },
       [sendGitCommand]
     );

     const pull = useCallback(
       (remote = 'origin', branch?: string) => {
         sendGitCommand('pull', { remote, branch });
       },
       [sendGitCommand]
     );

     const checkout = useCallback(
       (branch: string, create = false) => {
         sendGitCommand('checkout', { branch, create });
       },
       [sendGitCommand]
     );

     const stage = useCallback(
       (paths: string[]) => {
         sendGitCommand('stage', { paths });
       },
       [sendGitCommand]
     );

     const unstage = useCallback(
       (paths: string[]) => {
         sendGitCommand('unstage', { paths });
       },
       [sendGitCommand]
     );

     // 处理Git响应
     useEffect(() => {
       const unsubscribe = onMessage((message) => {
         if (message.type !== 'server:git_result') return;

         setLoading(false);

         if (!message.payload.success) {
           setError(message.payload.error || 'Git operation failed');
           return;
         }

         const { action, data } = message.payload;

         switch (action) {
           case 'status':
             setIsRepository(true);
             setCurrentBranch(data.branch);
             setFiles(data.files);
             break;
           case 'branch':
             setBranches(data.branches);
             break;
           case 'log':
             setCommits(data.commits);
             break;
           // ... 其他action
         }
       });

       return unsubscribe;
     }, [onMessage, setLoading, setError, setIsRepository, setCurrentBranch, setFiles, setBranches, setCommits]);

     return {
       getStatus,
       getBranches,
       getLog,
       getDiff,
       commit,
       push,
       pull,
       checkout,
       stage,
       unstage,
     };
   }
   ```

### 阶段6：Agent端Git处理

1. **Git处理器** (`apps/agent/src/handlers/git.ts`)
   - 执行git命令
   - 解析输出为结构化数据
   - 返回结果

### 输出要求
1. 完整的组件代码
2. 类型安全
3. 错误处理
4. 良好的用户体验

### 完成标志
- [ ] 终端可以正常显示和输入
- [ ] Git状态可以正确显示
- [ ] 可以执行commit/push/pull
- [ ] 可以切换和创建分支
- [ ] 可以查看提交历史
```

---

### 9.6 Chat 6 提示词：模板 + 插件 + 移动端

```markdown
# 任务：Web Claude Code - 项目模板、插件系统与移动端适配

## 项目背景
你正在参与开发一个名为 "Web Claude Code" 的Web平台。你负责**项目模板**、**插件系统**和**移动端适配**。

## 你的职责
1. 项目模板库和模板创建功能
2. 插件系统架构和插件市场
3. 响应式布局和移动端优化

## 工作目录
d:\github\Web-Claude code

## 技术栈
- React 18 + TypeScript
- Tailwind CSS (响应式)
- Zustand (状态管理)

## 详细任务清单

### 阶段1：项目模板系统

1. **模板数据结构**
   ```typescript
   // src/types/template.ts
   export interface Template {
     id: string;
     name: string;
     description: string;
     category: string;  // 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'other'
     icon: string;
     author: string;
     isOfficial: boolean;
     downloads: number;
     stars: number;
     version: string;
     config: TemplateConfig;
     createdAt: Date;
     updatedAt: Date;
   }

   export interface TemplateConfig {
     files: TemplateFile[];
     variables: TemplateVariable[];
     postCreateCommands?: string[];
   }

   export interface TemplateFile {
     path: string;
     content: string;
     isTemplate: boolean;  // 是否需要变量替换
   }

   export interface TemplateVariable {
     name: string;
     description: string;
     defaultValue?: string;
     required: boolean;
     type: 'string' | 'boolean' | 'select';
     options?: string[];  // for select type
   }
   ```

2. **模板Store** (`src/stores/template-store.ts`)
   - 模板列表
   - 搜索和过滤
   - 创建项目状态

3. **模板组件**
   - 模板列表 (`src/components/templates/template-list.tsx`)
   - 模板卡片 (`src/components/templates/template-card.tsx`)
   - 创建项目对话框 (`src/components/templates/create-project-dialog.tsx`)
   - 变量输入表单 (`src/components/templates/variable-form.tsx`)

4. **模板API**
   - GET /api/templates - 获取模板列表
   - GET /api/templates/:id - 获取模板详情
   - POST /api/templates/:id/create - 从模板创建项目

5. **内置模板** (templates/)
   - Next.js App
   - React + Vite
   - Vue 3
   - Express API
   - Python FastAPI
   - Static HTML

### 阶段2：插件系统

1. **插件SDK** (`packages/plugin-sdk/`)
   ```typescript
   // packages/plugin-sdk/src/types.ts
   export interface PluginManifest {
     name: string;
     displayName: string;
     version: string;
     description: string;
     author: string;
     icon?: string;
     permissions: PluginPermission[];
     contributes: PluginContributes;
   }

   export type PluginPermission =
     | 'file:read'
     | 'file:write'
     | 'terminal:execute'
     | 'git:read'
     | 'git:write'
     | 'chat:read'
     | 'chat:write';

   export interface PluginContributes {
     commands?: PluginCommand[];
     menus?: PluginMenu[];
     views?: PluginView[];
     settings?: PluginSetting[];
   }

   export interface PluginCommand {
     id: string;
     title: string;
     handler: string;  // 处理函数名
   }

   export interface PluginAPI {
     // 文件操作
     readFile(path: string): Promise<string>;
     writeFile(path: string, content: string): Promise<void>;
     listDirectory(path: string): Promise<FileNode[]>;

     // 终端
     executeCommand(command: string): Promise<string>;

     // Git
     getGitStatus(): Promise<GitStatus>;
     gitCommit(message: string): Promise<void>;

     // 聊天
     sendMessage(content: string): Promise<void>;
     onMessage(callback: (message: Message) => void): () => void;

     // UI
     showNotification(message: string, type: 'info' | 'success' | 'error'): void;
     showDialog(options: DialogOptions): Promise<any>;
   }
   ```

2. **插件Store** (`src/stores/plugin-store.ts`)
   - 已安装插件列表
   - 插件启用状态
   - 插件设置

3. **插件组件**
   - 插件列表 (`src/components/plugins/plugin-list.tsx`)
   - 插件卡片 (`src/components/plugins/plugin-card.tsx`)
   - 插件设置 (`src/components/plugins/plugin-settings.tsx`)
   - 插件详情对话框

4. **插件API**
   - GET /api/plugins - 获取可用插件列表
   - POST /api/plugins/install - 安装插件
   - DELETE /api/plugins/:id/uninstall - 卸载插件
   - PUT /api/plugins/:id/settings - 更新插件设置

5. **官方插件示例**
   - 代码审查插件
   - 测试生成插件
   - 文档生成插件

### 阶段3：移动端适配

1. **响应式布局**
   - 断点定义
   ```typescript
   // tailwind.config.js
   module.exports = {
     theme: {
       screens: {
         'sm': '640px',
         'md': '768px',
         'lg': '1024px',
         'xl': '1280px',
       },
     },
   };
   ```

2. **移动端布局** (`src/components/layout/mobile-layout.tsx`)
   - 底部导航栏
   - 标签页切换
   - 全屏模式

3. **移动端Hook** (`src/hooks/use-mobile.ts`)
   ```typescript
   import { useState, useEffect } from 'react';

   export function useMobile() {
     const [isMobile, setIsMobile] = useState(false);

     useEffect(() => {
       const checkMobile = () => {
         setIsMobile(window.innerWidth < 768);
       };

       checkMobile();
       window.addEventListener('resize', checkMobile);
       return () => window.removeEventListener('resize', checkMobile);
     }, []);

     return isMobile;
   }
   ```

4. **移动端导航** (`src/components/layout/mobile-nav.tsx`)
   - 底部Tab栏
   - 图标 + 文字
   - 活动状态

5. **触摸优化**
   - 更大的点击区域
   - 滑动手势
   - 长按菜单

6. **移动端组件适配**
   - 聊天界面：全屏显示
   - 文件树：抽屉形式
   - 编辑器：简化工具栏
   - 终端：横屏建议
   - Git：简化操作

7. **移动端工作区** (`src/app/(dashboard)/workspace/mobile-workspace.tsx`)
   ```typescript
   'use client';

   import { useState } from 'react';
   import { useMobile } from '@/hooks/use-mobile';
   import { ChatContainer } from '@/components/chat/chat-container';
   import { FileTree } from '@/components/file-tree/file-tree';
   import { CodeEditor } from '@/components/editor/code-editor';
   import { Terminal } from '@/components/terminal/terminal';
   import { MobileNav } from '@/components/layout/mobile-nav';

   type MobileTab = 'chat' | 'files' | 'editor' | 'terminal';

   export function MobileWorkspace() {
     const [activeTab, setActiveTab] = useState<MobileTab>('chat');

     return (
       <div className="flex flex-col h-screen">
         <div className="flex-1 overflow-hidden">
           {activeTab === 'chat' && <ChatContainer />}
           {activeTab === 'files' && <FileTree />}
           {activeTab === 'editor' && <CodeEditor />}
           {activeTab === 'terminal' && <Terminal sessionId="default" />}
         </div>

         <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
       </div>
     );
   }
   ```

8. **PWA支持**
   - manifest.json
   - Service Worker
   - 离线缓存

### 输出要求
1. 完整的组件代码
2. 响应式设计
3. 触摸友好
4. 良好的性能

### 完成标志
- [ ] 模板库可以正常显示和搜索
- [ ] 可以从模板创建项目
- [ ] 插件系统架构完成
- [ ] 可以安装和管理插件
- [ ] 移动端布局正常工作
- [ ] 触摸操作流畅
```

---

## 十、集成提示词（整合所有Chat的工作）

当所有6个Chat完成各自的模块后，使用以下提示词进行最终集成和部署。

### 10.1 集成Chat提示词

```markdown
# 任务：Web Claude Code - 最终集成与本地部署

## 项目背景
"Web Claude Code" 项目由6个独立Chat并行开发，现在需要你负责**最终集成**和**本地部署**。

## 你的职责
1. 检查所有模块的代码完整性
2. 解决模块间的依赖冲突
3. 集成测试
4. 配置本地开发环境
5. 启动并验证所有服务

## 工作目录
d:\github\Web-Claude code

## 前置条件
以下模块已由其他Chat完成：
- Chat 1: 项目基础 + 用户系统
- Chat 2: WebSocket服务器 + Agent
- Chat 3: 对话功能
- Chat 4: 文件管理 + 编辑器
- Chat 5: 终端 + Git
- Chat 6: 模板 + 插件 + 移动端

## 详细任务清单

### 阶段1：代码检查

1. **检查项目结构完整性**
   ```bash
   # 验证目录结构
   ls -la apps/
   ls -la apps/web/src/
   ls -la apps/ws-server/src/
   ls -la apps/agent/src/
   ls -la packages/shared/src/
   ```

2. **检查关键文件是否存在**
   - [ ] apps/web/package.json
   - [ ] apps/web/prisma/schema.prisma
   - [ ] apps/web/src/lib/db.ts
   - [ ] apps/web/src/lib/auth.ts
   - [ ] apps/web/src/lib/crypto.ts
   - [ ] apps/ws-server/src/index.ts
   - [ ] apps/ws-server/src/services/connection-manager.ts
   - [ ] apps/agent/src/index.ts
   - [ ] apps/agent/src/agent.ts
   - [ ] packages/shared/src/types/message.ts
   - [ ] packages/shared/src/constants/events.ts

3. **检查类型导入是否正确**
   - 所有apps/*是否正确引用@wcc/shared
   - 类型定义是否一致

### 阶段2：依赖安装与配置

1. **安装根依赖**
   ```bash
   cd d:\github\Web-Claude code
   pnpm install
   ```

2. **创建环境变量文件**

   **apps/web/.env.local:**
   ```env
   # 数据库
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/web_claude_code"

   # NextAuth
   NEXTAUTH_SECRET="your-super-secret-key-change-in-production"
   NEXTAUTH_URL="http://localhost:3000"

   # JWT
   JWT_SECRET="your-jwt-secret-key-change-in-production"

   # 加密密钥（必须32字符）
   ENCRYPTION_KEY="12345678901234567890123456789012"

   # WebSocket
   NEXT_PUBLIC_WS_URL="ws://localhost:8080"
   ```

   **apps/ws-server/.env:**
   ```env
   WS_PORT=8080
   JWT_SECRET="your-jwt-secret-key-change-in-production"
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/web_claude_code"
   ```

3. **初始化数据库**
   ```bash
   # 启动PostgreSQL（如果使用Docker）
   docker run -d --name postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=web_claude_code \
     -p 5432:5432 \
     postgres:15

   # 推送数据库Schema
   cd apps/web
   pnpm prisma db push
   pnpm prisma generate
   ```

4. **启动Redis（可选，用于缓存）**
   ```bash
   docker run -d --name redis -p 6379:6379 redis:7
   ```

### 阶段3：构建共享包

1. **构建shared包**
   ```bash
   cd packages/shared
   pnpm build
   ```

2. **构建plugin-sdk（如果有）**
   ```bash
   cd packages/plugin-sdk
   pnpm build
   ```

### 阶段4：启动服务

按以下顺序启动服务：

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
   pnpm dev
   # 或者先配置
   pnpm start config
   # 然后启动
   pnpm start start
   ```

### 阶段5：功能验证

1. **用户注册和登录**
   - 访问 http://localhost:3000/register
   - 创建账号
   - 登录

2. **设置API Key**
   - 进入设置页面
   - 添加Anthropic API Key

3. **创建Agent**
   - 进入Agent管理页面
   - 创建新Agent
   - 复制Secret Key

4. **测试Agent连接**
   - 配置本地Agent
   - 启动Agent
   - 验证在线状态

5. **测试对话功能**
   - 创建新会话
   - 发送测试消息
   - 验证流式输出

6. **测试文件管理**
   - 浏览文件树
   - 打开文件
   - 编辑并保存

7. **测试终端**
   - 打开终端
   - 执行命令

8. **测试Git功能**
   - 查看状态
   - 提交更改

### 阶段6：问题修复

根据测试结果，修复以下常见问题：

1. **WebSocket连接失败**
   - 检查WS_URL配置
   - 检查CORS设置
   - 检查端口是否被占用

2. **数据库连接失败**
   - 检查DATABASE_URL
   - 检查PostgreSQL是否运行
   - 检查网络连接

3. **认证问题**
   - 检查JWT_SECRET一致性
   - 检查NextAuth配置

4. **Agent连接问题**
   - 检查Secret Key
   - 检查网络连接
   - 查看Agent日志

### 阶段7：创建启动脚本

1. **Windows启动脚本 (start-dev.bat)**
   ```batch
   @echo off
   echo Starting Web Claude Code Development Environment...

   :: 检查Docker
   docker info >nul 2>&1
   if %errorlevel% neq 0 (
       echo Docker is not running! Please start Docker first.
       pause
       exit /b 1
   )

   :: 启动PostgreSQL
   docker start postgres 2>nul || docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=web_claude_code -p 5432:5432 postgres:15

   :: 启动Redis
   docker start redis 2>nul || docker run -d --name redis -p 6379:6379 redis:7

   :: 等待数据库就绪
   timeout /t 5

   :: 在新终端启动WebSocket服务器
   start "WS Server" cmd /k "cd apps\ws-server && pnpm dev"

   :: 等待WS服务器启动
   timeout /t 3

   :: 在新终端启动Web应用
   start "Web App" cmd /k "cd apps\web && pnpm dev"

   echo.
   echo All services started!
   echo Web App: http://localhost:3000
   echo WebSocket: ws://localhost:8080
   echo.
   pause
   ```

2. **Linux/Mac启动脚本 (start-dev.sh)**
   ```bash
   #!/bin/bash

   echo "Starting Web Claude Code Development Environment..."

   # 启动PostgreSQL
   docker start postgres 2>/dev/null || \
     docker run -d --name postgres \
       -e POSTGRES_PASSWORD=postgres \
       -e POSTGRES_DB=web_claude_code \
       -p 5432:5432 \
       postgres:15

   # 启动Redis
   docker start redis 2>/dev/null || \
     docker run -d --name redis -p 6379:6379 redis:7

   # 等待数据库就绪
   sleep 5

   # 使用tmux或在后台启动服务
   cd apps/ws-server && pnpm dev &
   WS_PID=$!

   sleep 3

   cd ../web && pnpm dev &
   WEB_PID=$!

   echo ""
   echo "All services started!"
   echo "Web App: http://localhost:3000"
   echo "WebSocket: ws://localhost:8080"
   echo ""
   echo "Press Ctrl+C to stop all services"

   # 等待中断
   trap "kill $WS_PID $WEB_PID 2>/dev/null" EXIT
   wait
   ```

### 阶段8：生成文档

1. **更新README.md**
   - 项目介绍
   - 快速开始
   - 开发指南
   - API文档链接

2. **创建CONTRIBUTING.md**
   - 贡献指南
   - 代码规范
   - PR流程

### 输出要求
1. 确保所有服务可以正常启动
2. 修复任何集成问题
3. 创建启动脚本
4. 验证核心功能

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
```

---

## 十一、Docker部署配置

### 11.1 docker-compose.yml

```yaml
version: '3.8'

services:
  # PostgreSQL数据库
  postgres:
    image: postgres:15-alpine
    container_name: wcc-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: web_claude_code
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis缓存
  redis:
    image: redis:7-alpine
    container_name: wcc-redis
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # WebSocket服务器
  ws-server:
    build:
      context: .
      dockerfile: apps/ws-server/Dockerfile
    container_name: wcc-ws-server
    environment:
      WS_PORT: 8080
      JWT_SECRET: ${JWT_SECRET}
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD:-postgres}@postgres:5432/web_claude_code
      REDIS_URL: redis://redis:6379
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # Next.js Web应用
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    container_name: wcc-web
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD:-postgres}@postgres:5432/web_claude_code
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL:-http://localhost:3000}
      JWT_SECRET: ${JWT_SECRET}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      NEXT_PUBLIC_WS_URL: ${NEXT_PUBLIC_WS_URL:-ws://localhost:8080}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
      - ws-server

  # Nginx反向代理（生产环境）
  nginx:
    image: nginx:alpine
    container_name: wcc-nginx
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - web
      - ws-server
    profiles:
      - production

volumes:
  postgres_data:
  redis_data:
```

### 11.2 apps/web/Dockerfile

```dockerfile
FROM node:20-alpine AS base

# 安装pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 依赖安装阶段
FROM base AS deps
WORKDIR /app

# 复制workspace配置
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 构建阶段
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

COPY . .

# 构建shared包
RUN cd packages/shared && pnpm build

# 生成Prisma客户端
RUN cd apps/web && pnpm prisma generate

# 构建Next.js应用
RUN cd apps/web && pnpm build

# 生产阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
```

### 11.3 apps/ws-server/Dockerfile

```dockerfile
FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/ws-server/package.json ./apps/ws-server/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/ws-server/node_modules ./apps/ws-server/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

COPY . .

RUN cd packages/shared && pnpm build
RUN cd apps/ws-server && pnpm build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/apps/ws-server/dist ./apps/ws-server/dist
COPY --from=builder /app/apps/ws-server/package.json ./apps/ws-server/
COPY --from=builder /app/apps/ws-server/node_modules ./apps/ws-server/node_modules

EXPOSE 8080

CMD ["node", "apps/ws-server/dist/index.js"]
```

---

## 十二、验证清单

### 12.1 开发环境验证

| 检查项 | 命令/操作 | 预期结果 |
|-------|----------|---------|
| 依赖安装 | `pnpm install` | 无错误 |
| 数据库连接 | `pnpm prisma db push` | Schema推送成功 |
| 共享包构建 | `cd packages/shared && pnpm build` | 构建成功 |
| WS服务器启动 | `cd apps/ws-server && pnpm dev` | 监听8080端口 |
| Web应用启动 | `cd apps/web && pnpm dev` | 监听3000端口 |
| 用户注册 | 访问/register | 可以创建账号 |
| 用户登录 | 访问/login | 可以登录 |
| Agent创建 | 访问/agents | 可以创建Agent |
| Agent连接 | 启动本地Agent | 显示在线 |
| 发送消息 | 在工作区发送 | 收到响应 |
| 文件浏览 | 查看文件树 | 正常显示 |
| 编辑文件 | 打开并编辑 | 可以保存 |
| 终端操作 | 打开终端 | 可以执行命令 |
| Git操作 | 查看状态 | 正常显示 |
| 移动端 | 手机访问 | 布局正常 |

### 12.2 生产环境验证

| 检查项 | 命令/操作 | 预期结果 |
|-------|----------|---------|
| Docker构建 | `docker-compose build` | 构建成功 |
| 服务启动 | `docker-compose up -d` | 所有容器运行 |
| 健康检查 | `docker-compose ps` | 所有healthy |
| HTTPS访问 | https://your-domain.com | 证书有效 |
| WebSocket | wss://your-domain.com/ws | 连接成功 |
| 性能测试 | 多用户并发 | 响应正常 |

---

## 十三、常见问题解决

### 13.1 依赖问题

**问题**: pnpm install失败
**解决**:
```bash
# 清除缓存
pnpm store prune
rm -rf node_modules
pnpm install
```

### 13.2 数据库问题

**问题**: Prisma连接失败
**解决**:
```bash
# 检查PostgreSQL是否运行
docker ps | grep postgres

# 手动测试连接
psql postgresql://postgres:postgres@localhost:5432/web_claude_code
```

### 13.3 WebSocket问题

**问题**: 前端无法连接WebSocket
**解决**:
- 检查NEXT_PUBLIC_WS_URL配置
- 检查浏览器控制台错误
- 确认ws-server正在运行

### 13.4 Agent问题

**问题**: Agent无法连接
**解决**:
- 验证Secret Key正确
- 检查服务器URL
- 查看Agent日志

---

## 十四、后续优化建议

1. **性能优化**
   - 实现消息分页加载
   - 添加虚拟滚动
   - 优化WebSocket重连

2. **安全加固**
   - 添加速率限制
   - 实现IP白名单
   - 加强输入验证

3. **监控告警**
   - 添加日志收集
   - 配置性能监控
   - 设置告警规则

4. **功能扩展**
   - 多语言支持
   - 主题定制
   - 协作功能
```
