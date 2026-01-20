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
