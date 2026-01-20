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

// Git类型已在 types/agent.ts 中定义，请从那里导入
// export { GitStatus, GitCommit, GitBranch } from './agent'
