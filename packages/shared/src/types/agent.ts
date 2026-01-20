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

// Git 类型定义
export interface GitStatus {
  branch: string
  ahead: number
  behind: number
  staged: string[]
  unstaged: string[]
  untracked: string[]
  isClean: boolean
}

export interface GitCommit {
  hash: string
  shortHash: string
  message: string
  author: string
  date: string
}

export interface GitBranch {
  name: string
  current: boolean
  remote?: string
}
