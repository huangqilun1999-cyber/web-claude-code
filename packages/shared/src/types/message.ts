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
