# Chat 2 提示词：WebSocket服务器 + Agent

## 任务说明
你正在参与开发 "Web Claude Code" 平台。**你的职责**：WebSocket服务器和本地Agent程序的开发。

## 工作目录
```
d:\github\Web-Claude code
```

## 技术栈
- Node.js + TypeScript
- WebSocket (ws库)
- Commander.js (CLI)
- child_process (进程管理)

---

## 详细任务清单

### 阶段1：共享类型包 (packages/shared)

1. **创建 packages/shared/package.json**
```json
{
  "name": "@wcc/shared",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

2. **创建 packages/shared/tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

3. **创建 packages/shared/src/index.ts**
```typescript
export * from './types/message'
export * from './types/agent'
export * from './types/api'
export * from './constants/events'
export * from './constants/errors'
export * from './utils/validation'
```

4. **创建 packages/shared/src/types/message.ts**
```typescript
// WebSocket消息基础结构
export interface WSMessage<T = unknown> {
  id: string
  type: string
  payload: T
  timestamp: number
}

// ==================== 客户端 -> 服务器 ====================

export interface ClientAuthPayload {
  token: string
}

export interface ClientExecutePayload {
  agentId: string
  sessionId?: string
  prompt: string
  workingDirectory?: string
  options?: {
    maxTurns?: number
    allowedTools?: string[]
  }
}

export interface ClientFilePayload {
  agentId: string
  action: 'list' | 'read' | 'write' | 'delete' | 'rename' | 'mkdir'
  path: string
  content?: string
  newPath?: string
}

export interface ClientTerminalPayload {
  agentId: string
  action: 'create' | 'input' | 'resize' | 'close'
  terminalId?: string
  data?: string
  cols?: number
  rows?: number
}

export interface ClientGitPayload {
  agentId: string
  action: 'status' | 'commit' | 'push' | 'pull' | 'branch' | 'checkout' | 'log' | 'diff'
  workingDirectory: string
  params?: Record<string, unknown>
}

// ==================== 服务器 -> 客户端 ====================

export interface ServerAuthResultPayload {
  success: boolean
  userId?: string
  error?: string
}

export interface ServerStreamPayload {
  sessionId: string
  content: string
  contentType: 'text' | 'code' | 'tool_use' | 'tool_result'
  isPartial: boolean
}

export interface ServerCompletePayload {
  sessionId: string
  claudeSessionId: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

export interface ServerErrorPayload {
  code: string
  message: string
  details?: unknown
}

export interface ServerAgentStatusPayload {
  agentId: string
  isOnline: boolean
  systemInfo?: Record<string, unknown>
}

// ==================== Agent -> 服务器 ====================

export interface AgentAuthPayload {
  secretKey: string
  systemInfo: {
    os: string
    hostname: string
    username: string
    homeDir: string
  }
}

export interface AgentStreamPayload {
  requestId: string
  content: string
  contentType: 'text' | 'code' | 'tool_use' | 'tool_result'
  isPartial: boolean
}

export interface AgentResponsePayload {
  requestId: string
  success: boolean
  data?: unknown
  error?: string
}

// ==================== 服务器 -> Agent ====================

export interface ServerExecutePayload {
  requestId: string
  sessionId: string
  prompt: string
  workingDirectory: string
  apiKey: string
  claudeSessionId?: string
  options?: {
    maxTurns?: number
    allowedTools?: string[]
  }
}

export interface ServerFilePayload {
  requestId: string
  action: 'list' | 'read' | 'write' | 'delete' | 'rename' | 'mkdir'
  path: string
  content?: string
  newPath?: string
}

export interface ServerTerminalPayload {
  requestId: string
  action: 'create' | 'input' | 'resize' | 'close'
  terminalId?: string
  data?: string
  cols?: number
  rows?: number
}

export interface ServerGitPayload {
  requestId: string
  action: 'status' | 'commit' | 'push' | 'pull' | 'branch' | 'checkout' | 'log' | 'diff'
  workingDirectory: string
  params?: Record<string, unknown>
}

// 消息类型枚举
export type ClientMessageType =
  | 'client:auth'
  | 'client:execute'
  | 'client:file'
  | 'client:terminal'
  | 'client:git'
  | 'client:ping'

export type ServerMessageType =
  | 'server:auth_result'
  | 'server:stream'
  | 'server:complete'
  | 'server:file_result'
  | 'server:terminal_output'
  | 'server:git_result'
  | 'server:agent_status'
  | 'server:error'
  | 'server:pong'

export type AgentMessageType =
  | 'agent:auth'
  | 'agent:stream'
  | 'agent:response'
  | 'agent:file_result'
  | 'agent:terminal_output'
  | 'agent:git_result'
  | 'agent:status'
  | 'agent:ping'

export type ServerToAgentMessageType =
  | 'server:agent_auth_result'
  | 'server:execute'
  | 'server:file'
  | 'server:terminal'
  | 'server:git'
  | 'server:pong'
```

5. **创建 packages/shared/src/types/agent.ts**
```typescript
export interface AgentInfo {
  id: string
  name: string
  type: 'LOCAL' | 'SERVER'
  isOnline: boolean
  lastSeenAt?: string
  currentDirectory?: string
  systemInfo?: SystemInfo
}

export interface SystemInfo {
  os: string
  hostname: string
  username: string
  homeDir: string
  platform?: string
  arch?: string
  nodeVersion?: string
  memory?: {
    total: number
    free: number
  }
}

export interface AgentConfig {
  serverUrl: string
  secretKey: string
  autoReconnect: boolean
  reconnectInterval: number
  heartbeatInterval: number
  allowedPaths?: string[]
}
```

6. **创建 packages/shared/src/types/api.ts**
```typescript
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface FileInfo {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  modifiedAt?: string
  extension?: string
}

export interface GitStatus {
  branch: string
  ahead: number
  behind: number
  staged: string[]
  unstaged: string[]
  untracked: string[]
}

export interface GitCommit {
  hash: string
  message: string
  author: string
  date: string
}

export interface GitBranch {
  name: string
  current: boolean
  remote?: string
}
```

7. **创建 packages/shared/src/constants/events.ts**
```typescript
export const WS_EVENTS = {
  // 客户端事件
  CLIENT_AUTH: 'client:auth',
  CLIENT_EXECUTE: 'client:execute',
  CLIENT_FILE: 'client:file',
  CLIENT_TERMINAL: 'client:terminal',
  CLIENT_GIT: 'client:git',
  CLIENT_PING: 'client:ping',

  // 服务器事件
  SERVER_AUTH_RESULT: 'server:auth_result',
  SERVER_STREAM: 'server:stream',
  SERVER_COMPLETE: 'server:complete',
  SERVER_FILE_RESULT: 'server:file_result',
  SERVER_TERMINAL_OUTPUT: 'server:terminal_output',
  SERVER_GIT_RESULT: 'server:git_result',
  SERVER_AGENT_STATUS: 'server:agent_status',
  SERVER_ERROR: 'server:error',
  SERVER_PONG: 'server:pong',

  // Agent事件
  AGENT_AUTH: 'agent:auth',
  AGENT_STREAM: 'agent:stream',
  AGENT_RESPONSE: 'agent:response',
  AGENT_FILE_RESULT: 'agent:file_result',
  AGENT_TERMINAL_OUTPUT: 'agent:terminal_output',
  AGENT_GIT_RESULT: 'agent:git_result',
  AGENT_STATUS: 'agent:status',
  AGENT_PING: 'agent:ping',

  // 服务器到Agent事件
  SERVER_AGENT_AUTH_RESULT: 'server:agent_auth_result',
  SERVER_EXECUTE: 'server:execute',
  SERVER_FILE: 'server:file',
  SERVER_TERMINAL: 'server:terminal',
  SERVER_GIT: 'server:git',
} as const

export type WSEventType = typeof WS_EVENTS[keyof typeof WS_EVENTS]
```

8. **创建 packages/shared/src/constants/errors.ts**
```typescript
export const ERROR_CODES = {
  // 认证错误
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_EXPIRED: 'AUTH_EXPIRED',

  // Agent错误
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  AGENT_OFFLINE: 'AGENT_OFFLINE',
  AGENT_BUSY: 'AGENT_BUSY',
  AGENT_AUTH_FAILED: 'AGENT_AUTH_FAILED',

  // 会话错误
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // 文件错误
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_ACCESS_DENIED: 'FILE_ACCESS_DENIED',
  FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',

  // 通用错误
  INVALID_REQUEST: 'INVALID_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}
```

9. **创建 packages/shared/src/utils/validation.ts**
```typescript
export function isValidPath(path: string, allowedPaths?: string[]): boolean {
  // 防止路径遍历攻击
  if (path.includes('..')) {
    return false
  }

  // 如果没有指定允许的路径，默认允许所有
  if (!allowedPaths || allowedPaths.length === 0) {
    return true
  }

  // 检查路径是否在允许的路径列表中
  return allowedPaths.some(
    (allowed) => path.startsWith(allowed) || path === allowed
  )
}

export function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function createMessage<T>(type: string, payload: T): {
  id: string
  type: string
  payload: T
  timestamp: number
} {
  return {
    id: generateMessageId(),
    type,
    payload,
    timestamp: Date.now(),
  }
}
```

---

### 阶段2：WebSocket服务器 (apps/ws-server)

1. **创建 apps/ws-server/package.json**
```json
{
  "name": "ws-server",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "ws": "^8.16.0",
    "jsonwebtoken": "^9.0.2",
    "@prisma/client": "^5.10.0",
    "dotenv": "^16.4.0",
    "@wcc/shared": "workspace:*"
  },
  "devDependencies": {
    "@types/ws": "^8.5.10",
    "@types/jsonwebtoken": "^9.0.5",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0",
    "prisma": "^5.10.0"
  }
}
```

2. **创建 apps/ws-server/tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

3. **创建 apps/ws-server/src/index.ts**
```typescript
import 'dotenv/config'
import { createServer } from './server'

const PORT = parseInt(process.env.WS_PORT || '8080', 10)

const server = createServer()

server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`)
})

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...')
  server.close()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...')
  server.close()
  process.exit(0)
})
```

4. **创建 apps/ws-server/src/server.ts**
```typescript
import { createServer as createHttpServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { ConnectionManager } from './services/connection-manager'
import { handleClientMessage } from './handlers/client'
import { handleAgentMessage } from './handlers/agent'
import { verifyToken } from './utils/jwt'

export function createServer() {
  const httpServer = createHttpServer()
  const wss = new WebSocketServer({ server: httpServer })
  const connectionManager = new ConnectionManager()

  wss.on('connection', (ws: WebSocket, request) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`)
    const connectionType = url.searchParams.get('type') || 'client'

    console.log(`New ${connectionType} connection`)

    // 设置连接超时（30秒内必须认证）
    const authTimeout = setTimeout(() => {
      if (!connectionManager.isAuthenticated(ws)) {
        ws.close(4001, 'Authentication timeout')
      }
    }, 30000)

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString())

        if (connectionType === 'agent') {
          await handleAgentMessage(ws, message, connectionManager)
        } else {
          await handleClientMessage(ws, message, connectionManager)
        }

        // 认证成功后清除超时
        if (connectionManager.isAuthenticated(ws)) {
          clearTimeout(authTimeout)
        }
      } catch (error) {
        console.error('Message handling error:', error)
        ws.send(JSON.stringify({
          id: Date.now().toString(),
          type: 'server:error',
          payload: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to process message',
          },
          timestamp: Date.now(),
        }))
      }
    })

    ws.on('close', () => {
      clearTimeout(authTimeout)
      connectionManager.removeConnection(ws)
      console.log(`${connectionType} disconnected`)
    })

    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
      clearTimeout(authTimeout)
      connectionManager.removeConnection(ws)
    })

    // 心跳检测
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping()
      }
    }, 30000)

    ws.on('close', () => clearInterval(pingInterval))
  })

  return httpServer
}
```

5. **创建 apps/ws-server/src/services/connection-manager.ts**
```typescript
import { WebSocket } from 'ws'
import { createMessage, WS_EVENTS } from '@wcc/shared'

interface ClientConnection {
  ws: WebSocket
  userId: string
  authenticatedAt: Date
}

interface AgentConnection {
  ws: WebSocket
  agentId: string
  userId: string
  authenticatedAt: Date
}

export class ConnectionManager {
  private clients = new Map<WebSocket, ClientConnection>()
  private agents = new Map<WebSocket, AgentConnection>()
  private agentById = new Map<string, WebSocket>()
  private userClients = new Map<string, Set<WebSocket>>()

  // 客户端管理
  addClient(ws: WebSocket, userId: string): void {
    this.clients.set(ws, {
      ws,
      userId,
      authenticatedAt: new Date(),
    })

    if (!this.userClients.has(userId)) {
      this.userClients.set(userId, new Set())
    }
    this.userClients.get(userId)!.add(ws)
  }

  getClientUserId(ws: WebSocket): string | undefined {
    return this.clients.get(ws)?.userId
  }

  // Agent管理
  addAgent(ws: WebSocket, agentId: string, userId: string): void {
    this.agents.set(ws, {
      ws,
      agentId,
      userId,
      authenticatedAt: new Date(),
    })
    this.agentById.set(agentId, ws)
  }

  getAgent(agentId: string): WebSocket | undefined {
    return this.agentById.get(agentId)
  }

  getAgentInfo(ws: WebSocket): AgentConnection | undefined {
    return this.agents.get(ws)
  }

  isAgentOnline(agentId: string): boolean {
    const ws = this.agentById.get(agentId)
    return ws !== undefined && ws.readyState === WebSocket.OPEN
  }

  // 通用
  isAuthenticated(ws: WebSocket): boolean {
    return this.clients.has(ws) || this.agents.has(ws)
  }

  removeConnection(ws: WebSocket): void {
    // 移除客户端
    const client = this.clients.get(ws)
    if (client) {
      this.clients.delete(ws)
      const userSockets = this.userClients.get(client.userId)
      if (userSockets) {
        userSockets.delete(ws)
        if (userSockets.size === 0) {
          this.userClients.delete(client.userId)
        }
      }
    }

    // 移除Agent
    const agent = this.agents.get(ws)
    if (agent) {
      this.agents.delete(ws)
      this.agentById.delete(agent.agentId)

      // 通知相关用户Agent离线
      this.notifyAgentStatus(agent.agentId, agent.userId, false)
    }
  }

  // 发送消息给用户的所有客户端
  sendToUser(userId: string, message: any): void {
    const sockets = this.userClients.get(userId)
    if (sockets) {
      const messageStr = JSON.stringify(message)
      sockets.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr)
        }
      })
    }
  }

  // 发送消息给Agent
  sendToAgent(agentId: string, message: any): boolean {
    const ws = this.agentById.get(agentId)
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
      return true
    }
    return false
  }

  // 通知Agent状态变化
  private notifyAgentStatus(agentId: string, userId: string, isOnline: boolean): void {
    const message = createMessage(WS_EVENTS.SERVER_AGENT_STATUS, {
      agentId,
      isOnline,
    })
    this.sendToUser(userId, message)
  }
}
```

6. **创建 apps/ws-server/src/handlers/client.ts**
```typescript
import { WebSocket } from 'ws'
import { ConnectionManager } from '../services/connection-manager'
import { verifyToken } from '../utils/jwt'
import { createMessage, WS_EVENTS, ERROR_CODES } from '@wcc/shared'
import { PrismaClient } from '@prisma/client'
import { decrypt } from '../utils/crypto'

const prisma = new PrismaClient()

export async function handleClientMessage(
  ws: WebSocket,
  message: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const { type, id, payload } = message

  switch (type) {
    case WS_EVENTS.CLIENT_AUTH:
      await handleAuth(ws, id, payload, connectionManager)
      break

    case WS_EVENTS.CLIENT_EXECUTE:
      await handleExecute(ws, id, payload, connectionManager)
      break

    case WS_EVENTS.CLIENT_FILE:
      await handleFile(ws, id, payload, connectionManager)
      break

    case WS_EVENTS.CLIENT_TERMINAL:
      await handleTerminal(ws, id, payload, connectionManager)
      break

    case WS_EVENTS.CLIENT_GIT:
      await handleGit(ws, id, payload, connectionManager)
      break

    case WS_EVENTS.CLIENT_PING:
      ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_PONG, {})))
      break

    default:
      ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
        code: ERROR_CODES.INVALID_REQUEST,
        message: `Unknown message type: ${type}`,
      })))
  }
}

async function handleAuth(
  ws: WebSocket,
  requestId: string,
  payload: { token: string },
  connectionManager: ConnectionManager
): Promise<void> {
  try {
    const decoded = verifyToken(payload.token)
    connectionManager.addClient(ws, decoded.id)

    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_AUTH_RESULT, {
      success: true,
      userId: decoded.id,
    })))
  } catch (error) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_AUTH_RESULT, {
      success: false,
      error: 'Invalid token',
    })))
  }
}

async function handleExecute(
  ws: WebSocket,
  requestId: string,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const userId = connectionManager.getClientUserId(ws)
  if (!userId) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
      code: ERROR_CODES.AUTH_REQUIRED,
      message: 'Authentication required',
    })))
    return
  }

  const { agentId, sessionId, prompt, workingDirectory, options } = payload

  // 检查Agent是否在线
  if (!connectionManager.isAgentOnline(agentId)) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
      code: ERROR_CODES.AGENT_OFFLINE,
      message: 'Agent is offline',
    })))
    return
  }

  // 获取用户的API Key
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { apiKeyEncrypted: true, apiKeyIv: true },
  })

  if (!user?.apiKeyEncrypted || !user?.apiKeyIv) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
      code: ERROR_CODES.INVALID_REQUEST,
      message: 'API Key not configured',
    })))
    return
  }

  // 解密API Key
  const apiKey = decrypt(user.apiKeyEncrypted, user.apiKeyIv)

  // 获取或创建会话
  let session = sessionId
    ? await prisma.session.findUnique({ where: { id: sessionId } })
    : null

  if (!session) {
    session = await prisma.session.create({
      data: {
        userId,
        agentId,
        name: `会话 ${new Date().toLocaleString()}`,
        workingDirectory,
      },
    })
  }

  // 保存用户消息
  await prisma.message.create({
    data: {
      sessionId: session.id,
      role: 'USER',
      content: prompt,
    },
  })

  // 发送给Agent执行
  const sent = connectionManager.sendToAgent(agentId, createMessage(WS_EVENTS.SERVER_EXECUTE, {
    requestId,
    sessionId: session.id,
    prompt,
    workingDirectory: workingDirectory || session.workingDirectory,
    apiKey,
    claudeSessionId: session.claudeSessionId,
    options,
  }))

  if (!sent) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
      code: ERROR_CODES.AGENT_OFFLINE,
      message: 'Failed to send to agent',
    })))
  }
}

async function handleFile(
  ws: WebSocket,
  requestId: string,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const userId = connectionManager.getClientUserId(ws)
  if (!userId) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
      code: ERROR_CODES.AUTH_REQUIRED,
      message: 'Authentication required',
    })))
    return
  }

  const { agentId, ...filePayload } = payload

  if (!connectionManager.isAgentOnline(agentId)) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
      code: ERROR_CODES.AGENT_OFFLINE,
      message: 'Agent is offline',
    })))
    return
  }

  connectionManager.sendToAgent(agentId, createMessage(WS_EVENTS.SERVER_FILE, {
    requestId,
    ...filePayload,
  }))
}

async function handleTerminal(
  ws: WebSocket,
  requestId: string,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const userId = connectionManager.getClientUserId(ws)
  if (!userId) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
      code: ERROR_CODES.AUTH_REQUIRED,
      message: 'Authentication required',
    })))
    return
  }

  const { agentId, ...terminalPayload } = payload

  if (!connectionManager.isAgentOnline(agentId)) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
      code: ERROR_CODES.AGENT_OFFLINE,
      message: 'Agent is offline',
    })))
    return
  }

  connectionManager.sendToAgent(agentId, createMessage(WS_EVENTS.SERVER_TERMINAL, {
    requestId,
    ...terminalPayload,
  }))
}

async function handleGit(
  ws: WebSocket,
  requestId: string,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const userId = connectionManager.getClientUserId(ws)
  if (!userId) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
      code: ERROR_CODES.AUTH_REQUIRED,
      message: 'Authentication required',
    })))
    return
  }

  const { agentId, ...gitPayload } = payload

  if (!connectionManager.isAgentOnline(agentId)) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
      code: ERROR_CODES.AGENT_OFFLINE,
      message: 'Agent is offline',
    })))
    return
  }

  connectionManager.sendToAgent(agentId, createMessage(WS_EVENTS.SERVER_GIT, {
    requestId,
    ...gitPayload,
  }))
}
```

7. **创建 apps/ws-server/src/handlers/agent.ts**
```typescript
import { WebSocket } from 'ws'
import { ConnectionManager } from '../services/connection-manager'
import { createMessage, WS_EVENTS, ERROR_CODES } from '@wcc/shared'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function handleAgentMessage(
  ws: WebSocket,
  message: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const { type, id, payload } = message

  switch (type) {
    case WS_EVENTS.AGENT_AUTH:
      await handleAgentAuth(ws, id, payload, connectionManager)
      break

    case WS_EVENTS.AGENT_STREAM:
      await handleAgentStream(ws, payload, connectionManager)
      break

    case WS_EVENTS.AGENT_RESPONSE:
      await handleAgentResponse(ws, payload, connectionManager)
      break

    case WS_EVENTS.AGENT_FILE_RESULT:
      await handleAgentFileResult(ws, payload, connectionManager)
      break

    case WS_EVENTS.AGENT_TERMINAL_OUTPUT:
      await handleAgentTerminalOutput(ws, payload, connectionManager)
      break

    case WS_EVENTS.AGENT_GIT_RESULT:
      await handleAgentGitResult(ws, payload, connectionManager)
      break

    case WS_EVENTS.AGENT_PING:
      ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_PONG, {})))
      break

    default:
      ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
        code: ERROR_CODES.INVALID_REQUEST,
        message: `Unknown message type: ${type}`,
      })))
  }
}

async function handleAgentAuth(
  ws: WebSocket,
  requestId: string,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const { secretKey, systemInfo } = payload

  try {
    // 验证Agent密钥
    const agent = await prisma.agent.findUnique({
      where: { secretKey },
      include: { user: { select: { id: true } } },
    })

    if (!agent) {
      ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_AGENT_AUTH_RESULT, {
        success: false,
        error: 'Invalid secret key',
      })))
      return
    }

    // 更新Agent状态
    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        isOnline: true,
        lastSeenAt: new Date(),
        systemInfo: systemInfo,
      },
    })

    // 注册Agent连接
    connectionManager.addAgent(ws, agent.id, agent.user.id)

    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_AGENT_AUTH_RESULT, {
      success: true,
      agentId: agent.id,
    })))

    // 通知用户Agent上线
    connectionManager.sendToUser(agent.user.id, createMessage(WS_EVENTS.SERVER_AGENT_STATUS, {
      agentId: agent.id,
      isOnline: true,
      systemInfo,
    }))

    console.log(`Agent ${agent.name} (${agent.id}) connected`)
  } catch (error) {
    console.error('Agent auth error:', error)
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_AGENT_AUTH_RESULT, {
      success: false,
      error: 'Authentication failed',
    })))
  }
}

async function handleAgentStream(
  ws: WebSocket,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const agentInfo = connectionManager.getAgentInfo(ws)
  if (!agentInfo) return

  // 转发流式输出给用户
  connectionManager.sendToUser(agentInfo.userId, createMessage(WS_EVENTS.SERVER_STREAM, {
    sessionId: payload.sessionId,
    content: payload.content,
    contentType: payload.contentType,
    isPartial: payload.isPartial,
  }))
}

async function handleAgentResponse(
  ws: WebSocket,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const agentInfo = connectionManager.getAgentInfo(ws)
  if (!agentInfo) return

  const { requestId, success, data, error } = payload

  if (success && data?.sessionId && data?.claudeSessionId) {
    // 更新会话的Claude Session ID
    await prisma.session.update({
      where: { id: data.sessionId },
      data: { claudeSessionId: data.claudeSessionId },
    })

    // 保存助手消息
    if (data.content) {
      await prisma.message.create({
        data: {
          sessionId: data.sessionId,
          role: 'ASSISTANT',
          content: data.content,
          metadata: data.usage ? { usage: data.usage } : undefined,
        },
      })
    }
  }

  // 通知用户完成
  connectionManager.sendToUser(agentInfo.userId, createMessage(WS_EVENTS.SERVER_COMPLETE, {
    sessionId: data?.sessionId,
    claudeSessionId: data?.claudeSessionId,
    usage: data?.usage,
  }))
}

async function handleAgentFileResult(
  ws: WebSocket,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const agentInfo = connectionManager.getAgentInfo(ws)
  if (!agentInfo) return

  connectionManager.sendToUser(agentInfo.userId, createMessage(WS_EVENTS.SERVER_FILE_RESULT, payload))
}

async function handleAgentTerminalOutput(
  ws: WebSocket,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const agentInfo = connectionManager.getAgentInfo(ws)
  if (!agentInfo) return

  connectionManager.sendToUser(agentInfo.userId, createMessage(WS_EVENTS.SERVER_TERMINAL_OUTPUT, payload))
}

async function handleAgentGitResult(
  ws: WebSocket,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const agentInfo = connectionManager.getAgentInfo(ws)
  if (!agentInfo) return

  connectionManager.sendToUser(agentInfo.userId, createMessage(WS_EVENTS.SERVER_GIT_RESULT, payload))
}
```

8. **创建 apps/ws-server/src/utils/jwt.ts**
```typescript
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface TokenPayload {
  id: string
  email: string
  role: string
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload
}

export function signToken(payload: TokenPayload, expiresIn = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn })
}
```

9. **创建 apps/ws-server/src/utils/crypto.ts**
```typescript
import { createDecipheriv } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters')
  }
  return Buffer.from(key, 'utf-8')
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
```

10. **创建 apps/ws-server/.env.example**
```env
WS_PORT=8080
JWT_SECRET="your-jwt-secret-key-change-in-production"
ENCRYPTION_KEY="12345678901234567890123456789012"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/web_claude_code"
```

---

### 阶段3：本地Agent (apps/agent)

1. **创建 apps/agent/package.json**
```json
{
  "name": "wcc-agent",
  "version": "0.1.0",
  "bin": {
    "wcc-agent": "./bin/wcc-agent.js"
  },
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "ws": "^8.16.0",
    "commander": "^12.0.0",
    "chalk": "^4.1.2",
    "conf": "^10.2.0",
    "node-pty": "^1.0.0",
    "chokidar": "^3.6.0",
    "@wcc/shared": "workspace:*"
  },
  "devDependencies": {
    "@types/ws": "^8.5.10",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0"
  }
}
```

2. **创建 apps/agent/tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

3. **创建 apps/agent/src/index.ts**
```typescript
#!/usr/bin/env node

import { Command } from 'commander'
import { Agent } from './agent'
import { ConfigManager } from './config'
import chalk from 'chalk'

const program = new Command()

program
  .name('wcc-agent')
  .description('Web Claude Code Local Agent')
  .version('0.1.0')

program
  .command('config')
  .description('Configure the agent')
  .option('-s, --server <url>', 'Server WebSocket URL')
  .option('-k, --key <key>', 'Agent secret key')
  .action(async (options) => {
    const config = new ConfigManager()

    if (options.server) {
      config.set('serverUrl', options.server)
      console.log(chalk.green('Server URL saved'))
    }

    if (options.key) {
      config.set('secretKey', options.key)
      console.log(chalk.green('Secret key saved'))
    }

    if (!options.server && !options.key) {
      console.log('Current configuration:')
      console.log(`  Server URL: ${config.get('serverUrl') || chalk.gray('(not set)')}`)
      console.log(`  Secret Key: ${config.get('secretKey') ? chalk.gray('****') : chalk.gray('(not set)')}`)
    }
  })

program
  .command('start')
  .description('Start the agent')
  .option('-s, --server <url>', 'Server WebSocket URL')
  .option('-k, --key <key>', 'Agent secret key')
  .action(async (options) => {
    const config = new ConfigManager()
    const serverUrl = options.server || config.get('serverUrl')
    const secretKey = options.key || config.get('secretKey')

    if (!serverUrl) {
      console.error(chalk.red('Error: Server URL not configured'))
      console.log('Run: wcc-agent config -s <server-url>')
      process.exit(1)
    }

    if (!secretKey) {
      console.error(chalk.red('Error: Secret key not configured'))
      console.log('Run: wcc-agent config -k <secret-key>')
      process.exit(1)
    }

    console.log(chalk.blue('Starting Web Claude Code Agent...'))
    console.log(`Connecting to: ${serverUrl}`)

    const agent = new Agent({
      serverUrl,
      secretKey,
      autoReconnect: true,
      reconnectInterval: 5000,
      heartbeatInterval: 30000,
    })

    await agent.connect()
  })

program.parse()
```

4. **创建 apps/agent/src/config.ts**
```typescript
import Conf from 'conf'

interface AgentConfig {
  serverUrl?: string
  secretKey?: string
  allowedPaths?: string[]
}

export class ConfigManager {
  private config: Conf<AgentConfig>

  constructor() {
    this.config = new Conf<AgentConfig>({
      projectName: 'wcc-agent',
      schema: {
        serverUrl: { type: 'string' },
        secretKey: { type: 'string' },
        allowedPaths: { type: 'array', items: { type: 'string' } },
      },
    })
  }

  get<K extends keyof AgentConfig>(key: K): AgentConfig[K] {
    return this.config.get(key)
  }

  set<K extends keyof AgentConfig>(key: K, value: AgentConfig[K]): void {
    this.config.set(key, value)
  }

  getAll(): AgentConfig {
    return this.config.store
  }

  clear(): void {
    this.config.clear()
  }
}
```

5. **创建 apps/agent/src/agent.ts**
```typescript
import WebSocket from 'ws'
import os from 'os'
import chalk from 'chalk'
import { AgentConfig, createMessage, WS_EVENTS } from '@wcc/shared'
import { ClaudeExecutor } from './handlers/claude'
import { FileSystemHandler } from './handlers/file-system'
import { TerminalHandler } from './handlers/terminal'
import { GitHandler } from './handlers/git'

export class Agent {
  private ws: WebSocket | null = null
  private config: AgentConfig
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private claudeExecutor: ClaudeExecutor
  private fileSystemHandler: FileSystemHandler
  private terminalHandler: TerminalHandler
  private gitHandler: GitHandler

  constructor(config: AgentConfig) {
    this.config = config
    this.claudeExecutor = new ClaudeExecutor()
    this.fileSystemHandler = new FileSystemHandler(config.allowedPaths)
    this.terminalHandler = new TerminalHandler()
    this.gitHandler = new GitHandler()
  }

  async connect(): Promise<void> {
    const url = `${this.config.serverUrl}?type=agent`

    this.ws = new WebSocket(url)

    this.ws.on('open', () => {
      console.log(chalk.green('Connected to server'))
      this.authenticate()
      this.startHeartbeat()
    })

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString())
        this.handleMessage(message)
      } catch (error) {
        console.error('Failed to parse message:', error)
      }
    })

    this.ws.on('close', () => {
      console.log(chalk.yellow('Disconnected from server'))
      this.stopHeartbeat()
      if (this.config.autoReconnect) {
        this.scheduleReconnect()
      }
    })

    this.ws.on('error', (error) => {
      console.error(chalk.red('WebSocket error:'), error.message)
    })
  }

  private authenticate(): void {
    const systemInfo = {
      os: os.platform(),
      hostname: os.hostname(),
      username: os.userInfo().username,
      homeDir: os.homedir(),
    }

    this.send(createMessage(WS_EVENTS.AGENT_AUTH, {
      secretKey: this.config.secretKey,
      systemInfo,
    }))
  }

  private async handleMessage(message: any): Promise<void> {
    const { type, payload } = message

    switch (type) {
      case WS_EVENTS.SERVER_AGENT_AUTH_RESULT:
        if (payload.success) {
          console.log(chalk.green('Authentication successful'))
        } else {
          console.error(chalk.red('Authentication failed:'), payload.error)
          this.ws?.close()
        }
        break

      case WS_EVENTS.SERVER_EXECUTE:
        await this.handleExecute(payload)
        break

      case WS_EVENTS.SERVER_FILE:
        await this.handleFile(payload)
        break

      case WS_EVENTS.SERVER_TERMINAL:
        await this.handleTerminal(payload)
        break

      case WS_EVENTS.SERVER_GIT:
        await this.handleGit(payload)
        break

      case WS_EVENTS.SERVER_PONG:
        // Heartbeat response
        break

      default:
        console.warn(`Unknown message type: ${type}`)
    }
  }

  private async handleExecute(payload: any): Promise<void> {
    const { requestId, sessionId, prompt, workingDirectory, apiKey, claudeSessionId, options } = payload

    console.log(chalk.blue(`Executing prompt: ${prompt.substring(0, 50)}...`))

    try {
      this.claudeExecutor.on('stream', (chunk) => {
        this.send(createMessage(WS_EVENTS.AGENT_STREAM, {
          requestId,
          sessionId,
          content: chunk.content,
          contentType: chunk.type,
          isPartial: true,
        }))
      })

      const result = await this.claudeExecutor.execute({
        prompt,
        workingDirectory,
        apiKey,
        sessionId: claudeSessionId,
        maxTurns: options?.maxTurns,
        allowedTools: options?.allowedTools,
      })

      this.send(createMessage(WS_EVENTS.AGENT_RESPONSE, {
        requestId,
        success: true,
        data: {
          sessionId,
          claudeSessionId: result.sessionId,
          content: result.content,
          usage: result.usage,
        },
      }))
    } catch (error: any) {
      console.error(chalk.red('Execute error:'), error.message)
      this.send(createMessage(WS_EVENTS.AGENT_RESPONSE, {
        requestId,
        success: false,
        error: error.message,
      }))
    } finally {
      this.claudeExecutor.removeAllListeners('stream')
    }
  }

  private async handleFile(payload: any): Promise<void> {
    const { requestId, action, path, content, newPath } = payload

    try {
      let result: any

      switch (action) {
        case 'list':
          result = await this.fileSystemHandler.list(path)
          break
        case 'read':
          result = await this.fileSystemHandler.read(path)
          break
        case 'write':
          result = await this.fileSystemHandler.write(path, content)
          break
        case 'delete':
          result = await this.fileSystemHandler.delete(path)
          break
        case 'rename':
          result = await this.fileSystemHandler.rename(path, newPath)
          break
        case 'mkdir':
          result = await this.fileSystemHandler.mkdir(path)
          break
      }

      this.send(createMessage(WS_EVENTS.AGENT_FILE_RESULT, {
        requestId,
        success: true,
        data: result,
      }))
    } catch (error: any) {
      this.send(createMessage(WS_EVENTS.AGENT_FILE_RESULT, {
        requestId,
        success: false,
        error: error.message,
      }))
    }
  }

  private async handleTerminal(payload: any): Promise<void> {
    const { requestId, action, terminalId, data, cols, rows } = payload

    try {
      let result: any

      switch (action) {
        case 'create':
          result = this.terminalHandler.create((output) => {
            this.send(createMessage(WS_EVENTS.AGENT_TERMINAL_OUTPUT, {
              requestId,
              terminalId: result?.id,
              data: output,
            }))
          })
          break
        case 'input':
          this.terminalHandler.write(terminalId, data)
          break
        case 'resize':
          this.terminalHandler.resize(terminalId, cols, rows)
          break
        case 'close':
          this.terminalHandler.close(terminalId)
          break
      }

      this.send(createMessage(WS_EVENTS.AGENT_RESPONSE, {
        requestId,
        success: true,
        data: result,
      }))
    } catch (error: any) {
      this.send(createMessage(WS_EVENTS.AGENT_RESPONSE, {
        requestId,
        success: false,
        error: error.message,
      }))
    }
  }

  private async handleGit(payload: any): Promise<void> {
    const { requestId, action, workingDirectory, params } = payload

    try {
      let result: any

      switch (action) {
        case 'status':
          result = await this.gitHandler.status(workingDirectory)
          break
        case 'commit':
          result = await this.gitHandler.commit(workingDirectory, params?.message)
          break
        case 'push':
          result = await this.gitHandler.push(workingDirectory, params?.remote, params?.branch)
          break
        case 'pull':
          result = await this.gitHandler.pull(workingDirectory, params?.remote, params?.branch)
          break
        case 'branch':
          result = await this.gitHandler.branches(workingDirectory)
          break
        case 'checkout':
          result = await this.gitHandler.checkout(workingDirectory, params?.branch)
          break
        case 'log':
          result = await this.gitHandler.log(workingDirectory, params?.limit)
          break
        case 'diff':
          result = await this.gitHandler.diff(workingDirectory, params?.staged)
          break
      }

      this.send(createMessage(WS_EVENTS.AGENT_GIT_RESULT, {
        requestId,
        success: true,
        data: result,
      }))
    } catch (error: any) {
      this.send(createMessage(WS_EVENTS.AGENT_GIT_RESULT, {
        requestId,
        success: false,
        error: error.message,
      }))
    }
  }

  private send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send(createMessage(WS_EVENTS.AGENT_PING, {}))
    }, this.config.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return

    console.log(chalk.yellow(`Reconnecting in ${this.config.reconnectInterval / 1000}s...`))
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, this.config.reconnectInterval)
  }

  disconnect(): void {
    this.config.autoReconnect = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.stopHeartbeat()
    this.ws?.close()
  }
}
```

6. **创建 apps/agent/src/handlers/claude.ts**
```typescript
import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'

interface ClaudeOptions {
  prompt: string
  workingDirectory: string
  apiKey: string
  sessionId?: string
  maxTurns?: number
  allowedTools?: string[]
}

interface StreamChunk {
  type: 'text' | 'code' | 'tool_use' | 'tool_result'
  content: string
}

interface ExecuteResult {
  sessionId: string
  content: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

export class ClaudeExecutor extends EventEmitter {
  private process: ChildProcess | null = null

  async execute(options: ClaudeOptions): Promise<ExecuteResult> {
    return new Promise((resolve, reject) => {
      const args = this.buildArgs(options)

      this.process = spawn('claude', args, {
        cwd: options.workingDirectory,
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: options.apiKey,
        },
        shell: true,
      })

      let stdout = ''
      let stderr = ''
      let sessionId = options.sessionId || ''

      this.process.stdout?.on('data', (data) => {
        const chunk = data.toString()
        stdout += chunk

        // 尝试解析stream-json格式
        const lines = chunk.split('\n').filter((line: string) => line.trim())
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line)
            if (parsed.session_id) {
              sessionId = parsed.session_id
            }
            if (parsed.type && parsed.content) {
              this.emit('stream', {
                type: parsed.type,
                content: parsed.content,
              } as StreamChunk)
            }
          } catch {
            // 普通文本输出
            this.emit('stream', {
              type: 'text',
              content: line,
            } as StreamChunk)
          }
        }
      })

      this.process.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      this.process.on('close', (code) => {
        if (code === 0) {
          resolve({
            sessionId,
            content: stdout,
          })
        } else {
          reject(new Error(stderr || `Process exited with code ${code}`))
        }
        this.process = null
      })

      this.process.on('error', (error) => {
        reject(error)
        this.process = null
      })
    })
  }

  private buildArgs(options: ClaudeOptions): string[] {
    const args = [
      '-p', `"${options.prompt.replace(/"/g, '\\"')}"`,
      '--output-format', 'stream-json',
    ]

    if (options.sessionId) {
      args.push('--resume', options.sessionId)
    }

    if (options.maxTurns) {
      args.push('--max-turns', options.maxTurns.toString())
    }

    return args
  }

  abort(): void {
    if (this.process) {
      this.process.kill('SIGTERM')
      this.process = null
    }
  }
}
```

7. **创建 apps/agent/src/handlers/file-system.ts** - 见下一条继续...

8. **创建 apps/agent/src/handlers/terminal.ts** - 见下一条继续...

9. **创建 apps/agent/src/handlers/git.ts** - 见下一条继续...

10. **创建 apps/agent/bin/wcc-agent.js**
```javascript
#!/usr/bin/env node
require('../dist/index.js')
```

---

## 输出要求

1. 确保所有类型定义完整
2. WebSocket消息格式一致
3. Agent可以正确连接和认证
4. 消息路由正确

## 完成标志

- [ ] shared包类型定义完成
- [ ] WebSocket服务器可以运行
- [ ] Agent CLI可以配置和启动
- [ ] Agent可以连接到服务器
- [ ] 消息转发正常

## 注意事项

1. **不要安装依赖**，只创建文件
2. **严格遵循消息格式**，确保前后端一致
3. Agent密钥验证必须安全
4. 实现自动重连机制
