# Chat 1 提示词：项目基础 + 用户系统

## 任务说明
你正在参与开发一个名为 "Web Claude Code" 的Web平台，该平台允许用户通过浏览器远程控制本地或服务器上的Claude Code CLI进行AI辅助开发。

**你的职责**：项目基础架构和用户认证系统的开发。

## 工作目录
```
d:\github\Web-Claude code
```

## 技术栈
- Next.js 14 (App Router) + TypeScript
- PostgreSQL + Prisma ORM
- NextAuth.js + JWT
- Tailwind CSS + shadcn/ui
- pnpm (包管理器)
- Turborepo (monorepo管理)

---

## 详细任务清单

### 阶段1：项目初始化

1. **创建monorepo结构**
```bash
# 在项目根目录执行
cd "d:\github\Web-Claude code"

# 创建目录结构
mkdir -p apps/web apps/ws-server apps/agent packages/shared packages/plugin-sdk docs templates plugins
```

2. **创建 pnpm-workspace.yaml**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

3. **创建根 package.json**
```json
{
  "name": "web-claude-code",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "db:push": "pnpm --filter web db:push",
    "db:migrate": "pnpm --filter web db:migrate",
    "db:studio": "pnpm --filter web db:studio"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0"
  },
  "packageManager": "pnpm@8.15.0"
}
```

4. **创建 turbo.json**
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
    "lint": {
      "dependsOn": ["^build"]
    }
  }
}
```

---

### 阶段2：Next.js Web应用初始化

1. **创建 apps/web/package.json**
```json
{
  "name": "web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next-auth": "^4.24.0",
    "@prisma/client": "^5.10.0",
    "@tanstack/react-query": "^5.28.0",
    "zustand": "^4.5.0",
    "zod": "^3.22.0",
    "bcryptjs": "^2.4.3",
    "jose": "^5.2.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.356.0",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "class-variance-authority": "^0.7.0",
    "@wcc/shared": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/bcryptjs": "^2.4.6",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "prisma": "^5.10.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "14.2.0"
  }
}
```

2. **创建 apps/web/tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

3. **创建 apps/web/next.config.js**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@wcc/shared'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
```

4. **创建 apps/web/tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
```

5. **创建 apps/web/postcss.config.js**
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

### 阶段3：Prisma数据库配置

1. **创建 apps/web/prisma/schema.prisma**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 用户
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  passwordHash    String    @map("password_hash")
  name            String?
  avatar          String?
  apiKeyEncrypted String?   @map("api_key_encrypted")
  apiKeyIv        String?   @map("api_key_iv")
  role            UserRole  @default(USER)
  status          UserStatus @default(ACTIVE)
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  lastLoginAt     DateTime? @map("last_login_at")

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

// Agent
model Agent {
  id               String      @id @default(cuid())
  userId           String      @map("user_id")
  name             String
  description      String?
  secretKey        String      @unique @map("secret_key")
  type             AgentType   @default(LOCAL)
  isOnline         Boolean     @default(false) @map("is_online")
  lastSeenAt       DateTime?   @map("last_seen_at")
  currentDirectory String?     @map("current_directory")
  systemInfo       Json?       @map("system_info")
  allowedPaths     String[]    @default([]) @map("allowed_paths")
  createdAt        DateTime    @default(now()) @map("created_at")
  updatedAt        DateTime    @updatedAt @map("updated_at")

  user             User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessions         Session[]

  @@index([userId])
  @@index([secretKey])
  @@map("agents")
}

enum AgentType {
  LOCAL
  SERVER
}

// 会话
model Session {
  id               String        @id @default(cuid())
  userId           String        @map("user_id")
  agentId          String?       @map("agent_id")
  name             String
  workingDirectory String?       @map("working_directory")
  claudeSessionId  String?       @map("claude_session_id")
  status           SessionStatus @default(ACTIVE)
  metadata         Json?
  createdAt        DateTime      @default(now()) @map("created_at")
  updatedAt        DateTime      @updatedAt @map("updated_at")

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

// 消息
model Message {
  id          String      @id @default(cuid())
  sessionId   String      @map("session_id")
  role        MessageRole
  content     String
  contentType ContentType @default(TEXT) @map("content_type")
  metadata    Json?
  createdAt   DateTime    @default(now()) @map("created_at")

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

// 模板
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
  config      Json
  downloads   Int            @default(0)
  stars       Int            @default(0)
  version     String         @default("1.0.0")
  createdAt   DateTime       @default(now()) @map("created_at")
  updatedAt   DateTime       @updatedAt @map("updated_at")

  authorUser  User?          @relation("UserTemplates", fields: [authorId], references: [id], onDelete: SetNull)

  @@index([category])
  @@index([isPublic])
  @@map("templates")
}

// 插件
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
  config      Json?
  permissions String[]      @default([])
  downloads   Int           @default(0)
  rating      Float         @default(0)
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  userPlugins UserPlugin[]

  @@map("plugins")
}

// 用户插件关联
model UserPlugin {
  id          String    @id @default(cuid())
  userId      String    @map("user_id")
  pluginId    String    @map("plugin_id")
  isEnabled   Boolean   @default(true) @map("is_enabled")
  settings    Json?
  installedAt DateTime  @default(now()) @map("installed_at")

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  plugin      Plugin    @relation(fields: [pluginId], references: [id], onDelete: Cascade)

  @@unique([userId, pluginId])
  @@map("user_plugins")
}

// 系统配置
model SystemConfig {
  id        String   @id @default(cuid())
  key       String   @unique
  value     Json
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("system_config")
}
```

---

### 阶段4：核心库文件

1. **创建 apps/web/src/lib/db.ts**
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
```

2. **创建 apps/web/src/lib/crypto.ts**
```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters')
  }
  return Buffer.from(key, 'utf-8')
}

export function encrypt(text: string): { encrypted: string; iv: string } {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return {
    encrypted: encrypted + authTag.toString('hex'),
    iv: iv.toString('hex'),
  }
}

export function decrypt(encrypted: string, ivHex: string): string {
  const iv = Buffer.from(ivHex, 'hex')
  const encryptedText = encrypted.slice(0, -AUTH_TAG_LENGTH * 2)
  const authTag = Buffer.from(encrypted.slice(-AUTH_TAG_LENGTH * 2), 'hex')

  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

export function generateSecretKey(): string {
  return randomBytes(32).toString('hex')
}
```

3. **创建 apps/web/src/lib/auth.ts**
```typescript
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import prisma from './db'

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
          throw new Error('请输入邮箱和密码')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          throw new Error('用户不存在')
        }

        if (user.status !== 'ACTIVE') {
          throw new Error('账号已被禁用')
        }

        const isPasswordValid = await compare(credentials.password, user.passwordHash)

        if (!isPasswordValid) {
          throw new Error('密码错误')
        }

        // 更新最后登录时间
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}
```

4. **创建 apps/web/src/lib/utils.ts**
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}
```

---

### 阶段5：API路由

1. **创建 apps/web/src/app/api/auth/[...nextauth]/route.ts**
```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

2. **创建 apps/web/src/app/api/auth/register/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import prisma from '@/lib/db'

const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少8个字符'),
  name: z.string().min(2, '姓名至少2个字符').optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = registerSchema.parse(body)

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      )
    }

    // 创建用户
    const passwordHash = await hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    )
  }
}
```

3. **创建 apps/web/src/app/api/auth/api-key/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import prisma from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { encrypt, decrypt } from '@/lib/crypto'

const apiKeySchema = z.object({
  apiKey: z.string().min(1, 'API Key不能为空'),
})

// 设置API Key
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { apiKey } = apiKeySchema.parse(body)

    const { encrypted, iv } = encrypt(apiKey)

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        apiKeyEncrypted: encrypted,
        apiKeyIv: iv,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Set API key error:', error)
    return NextResponse.json(
      { error: '设置失败' },
      { status: 500 }
    )
  }
}

// 检查API Key状态
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        apiKeyEncrypted: true,
      },
    })

    return NextResponse.json({
      hasApiKey: !!user?.apiKeyEncrypted,
    })
  } catch (error) {
    console.error('Get API key status error:', error)
    return NextResponse.json(
      { error: '获取失败' },
      { status: 500 }
    )
  }
}

// 删除API Key
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        apiKeyEncrypted: null,
        apiKeyIv: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete API key error:', error)
    return NextResponse.json(
      { error: '删除失败' },
      { status: 500 }
    )
  }
}
```

4. **创建 apps/web/src/app/api/agents/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import prisma from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { generateSecretKey } from '@/lib/crypto'

const createAgentSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  description: z.string().optional(),
  type: z.enum(['LOCAL', 'SERVER']).default('LOCAL'),
  allowedPaths: z.array(z.string()).optional(),
})

// 获取用户的Agent列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const agents = await prisma.agent.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ agents })
  } catch (error) {
    console.error('Get agents error:', error)
    return NextResponse.json(
      { error: '获取失败' },
      { status: 500 }
    )
  }
}

// 创建新Agent
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const data = createAgentSchema.parse(body)

    const agent = await prisma.agent.create({
      data: {
        userId: session.user.id,
        name: data.name,
        description: data.description,
        type: data.type,
        secretKey: generateSecretKey(),
        allowedPaths: data.allowedPaths || [],
      },
    })

    return NextResponse.json({ agent }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Create agent error:', error)
    return NextResponse.json(
      { error: '创建失败' },
      { status: 500 }
    )
  }
}
```

---

### 阶段6：页面组件

1. **创建 apps/web/src/app/globals.css**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

2. **创建 apps/web/src/app/layout.tsx**
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Web Claude Code',
  description: '通过Web远程控制Claude Code',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

3. **创建 apps/web/src/app/providers.tsx**
```typescript
'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  )
}
```

4. **创建 apps/web/src/app/page.tsx**
```typescript
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/workspace')
  } else {
    redirect('/login')
  }
}
```

5. **创建 apps/web/src/app/(auth)/layout.tsx**
```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
```

6. **创建 apps/web/src/app/(auth)/login/page.tsx**
```typescript
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/workspace')
        router.refresh()
      }
    } catch (err) {
      setError('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">登录</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </form>

      <p className="text-center mt-4 text-sm text-gray-600">
        没有账号？{' '}
        <Link href="/register" className="text-blue-600 hover:underline">
          注册
        </Link>
      </p>
    </div>
  )
}
```

7. **创建 apps/web/src/app/(auth)/register/page.tsx**
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '注册失败')
      }

      router.push('/login?registered=true')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">注册</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">邮箱 *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">姓名（可选）</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">密码 *</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            minLength={8}
          />
          <p className="text-xs text-gray-500 mt-1">至少8个字符</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">确认密码 *</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '注册中...' : '注册'}
        </button>
      </form>

      <p className="text-center mt-4 text-sm text-gray-600">
        已有账号？{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          登录
        </Link>
      </p>
    </div>
  )
}
```

---

### 阶段7：环境变量和类型声明

1. **创建 apps/web/.env.example**
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

# WebSocket服务器
NEXT_PUBLIC_WS_URL="ws://localhost:8080"
```

2. **创建 apps/web/src/types/next-auth.d.ts**
```typescript
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
  }
}
```

---

## 输出要求

1. 确保所有文件路径正确
2. 代码可以正常编译
3. 数据库Schema完整
4. 认证流程完整
5. API接口可用

## 完成标志

- [ ] monorepo结构创建完成
- [ ] Next.js应用配置完成
- [ ] Prisma数据库Schema完成
- [ ] 认证API完成
- [ ] Agent管理API完成
- [ ] 登录注册页面完成

## 注意事项

1. **不要安装依赖**，只创建文件，依赖安装由集成Chat负责
2. **严格按照文件路径创建**，确保monorepo引用正确
3. **环境变量必须配置**，否则会报错
4. 所有API都需要错误处理
