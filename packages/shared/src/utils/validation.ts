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
