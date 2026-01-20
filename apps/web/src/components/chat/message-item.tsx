'use client'

import { memo, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { Message } from '@/stores/session-store'
import { cn, copyToClipboard, formatRelativeTime } from '@/lib/utils'
import {
  User,
  Bot,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  Terminal,
  RefreshCw,
  HelpCircle,
  Wrench,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

interface MessageItemProps {
  message: Message
  isLast?: boolean
  onRetry?: () => void
}

export const MessageItem = memo(function MessageItem({
  message,
  isLast,
  onRetry,
}: MessageItemProps) {
  const [copied, setCopied] = useState(false)

  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const isSystem = message.role === 'system'
  const isTool = message.role === 'tool'
  const isError = message.contentType === 'error'
  const isQuestion = message.contentType === 'question'
  const isToolCall = message.contentType === 'tool_call'
  const isToolResult = message.contentType === 'tool_result'

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(message.content)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [message.content])

  const getAvatar = () => {
    if (isUser) {
      return (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      )
    }

    if (isQuestion) {
      return (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
          <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      )
    }

    if (isToolCall) {
      return (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
          <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      )
    }

    if (isToolResult) {
      return (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      )
    }

    if (isAssistant) {
      return (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      )
    }

    if (isTool) {
      return (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
          <Terminal className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      )
    }

    if (isError) {
      return (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
          <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      )
    }

    if (isSystem) {
      return (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      )
    }

    return null
  }

  const getRoleName = () => {
    if (isUser) return '你'
    if (isQuestion) return 'Claude 需要您的输入'
    if (isToolCall) return '工具调用'
    if (isToolResult) return '执行结果'
    if (isAssistant) return 'Claude'
    if (isTool) return '工具'
    if (isError) return '错误'
    if (isSystem) return '系统'
    return '未知'
  }

  return (
    <div
      className={cn(
        'group flex gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg transition-colors',
        isUser && 'bg-blue-50 dark:bg-blue-900/20',
        isQuestion && 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800',
        isToolCall && 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-400',
        isToolResult && 'bg-teal-50 dark:bg-teal-900/20 border-l-4 border-teal-400',
        isAssistant && !isQuestion && 'bg-gray-50 dark:bg-gray-800/50',
        isTool && 'bg-green-50 dark:bg-green-900/20',
        isError && 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400',
        isSystem && !isError && !isToolCall && !isToolResult && 'bg-orange-50 dark:bg-orange-900/20'
      )}
    >
      {/* Avatar */}
      {getAvatar()}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{getRoleName()}</span>
          <span className="text-xs text-gray-400">
            {formatRelativeTime(message.createdAt)}
          </span>
        </div>

        <div
          className={cn(
            'prose prose-sm dark:prose-invert max-w-none',
            isError && 'text-red-600 dark:text-red-400'
          )}
        >
          {isAssistant && !isError ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                pre: ({ children, ...props }) => (
                  <pre
                    className="bg-gray-900 rounded-lg p-4 overflow-x-auto relative group/code"
                    {...props}
                  >
                    {children}
                  </pre>
                ),
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '')
                  const isInline = !match && !className

                  if (isInline) {
                    return (
                      <code
                        className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  }

                  return (
                    <code className={cn(className, 'font-mono')} {...props}>
                      {children}
                    </code>
                  )
                },
                // 表格样式
                table: ({ children, ...props }) => (
                  <div className="overflow-x-auto">
                    <table className="border-collapse border border-gray-300 dark:border-gray-600" {...props}>
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children, ...props }) => (
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-100 dark:bg-gray-700" {...props}>
                    {children}
                  </th>
                ),
                td: ({ children, ...props }) => (
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-2" {...props}>
                    {children}
                  </td>
                ),
                // 链接样式
                a: ({ children, href, ...props }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 underline"
                    {...props}
                  >
                    {children}
                  </a>
                ),
                // 列表样式
                ul: ({ children, ...props }) => (
                  <ul className="list-disc pl-5 space-y-1" {...props}>
                    {children}
                  </ul>
                ),
                ol: ({ children, ...props }) => (
                  <ol className="list-decimal pl-5 space-y-1" {...props}>
                    {children}
                  </ol>
                ),
              }}
            >
              {message.content || ' '}
            </ReactMarkdown>
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>

        {/* Streaming indicator */}
        {message.isStreaming && (
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>正在输入...</span>
          </div>
        )}

        {/* Actions - 移动端始终可见 */}
        {!message.isStreaming && message.content && (
          <div className="flex items-center gap-1 sm:gap-2 mt-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-2 sm:p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors touch-manipulation"
              title="复制"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {isError && onRetry && (
              <button
                onClick={onRetry}
                className="p-2 sm:p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors touch-manipulation"
                title="重试"
              >
                <RefreshCw className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
})
