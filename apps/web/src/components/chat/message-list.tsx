'use client'

import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { Message } from '@/stores/session-store'
import { MessageItem } from './message-item'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageListProps {
  messages: Message[]
  isThinking?: boolean
}

export function MessageList({ messages, isThinking = false }: MessageListProps) {
  // 按序列号排序消息，确保消息按正确顺序显示
  // 如果没有序列号则使用创建时间作为后备
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      // 优先使用序列号排序
      if (a.sequence !== undefined && b.sequence !== undefined) {
        return a.sequence - b.sequence
      }
      // 如果只有一个有序列号，有序列号的排在后面（新消息）
      if (a.sequence !== undefined) return 1
      if (b.sequence !== undefined) return -1
      // 都没有序列号时使用时间戳
      const timeA = new Date(a.createdAt).getTime()
      const timeB = new Date(b.createdAt).getTime()
      return timeA - timeB
    })
  }, [messages])
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)

  // 检查是否在底部附近
  const isNearBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return true

    const threshold = 100 // pixels from bottom
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold
  }, [])

  // 滚动到底部
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    })
  }, [])

  // 监听滚动事件
  const handleScroll = useCallback(() => {
    const nearBottom = isNearBottom()
    setShowScrollButton(!nearBottom)
    setIsAutoScrolling(nearBottom)
  }, [isNearBottom])

  // 消息更新时自动滚动
  useEffect(() => {
    if (isAutoScrolling) {
      scrollToBottom()
    }
  }, [messages, isAutoScrolling, scrollToBottom, isThinking])

  // 新消息流式输出时保持滚动
  useEffect(() => {
    const streamingMessage = messages.find((m) => m.isStreaming)
    if (streamingMessage && isAutoScrolling) {
      scrollToBottom(false)
    }
  }, [messages, isAutoScrolling, scrollToBottom])

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-5xl mb-4">💭</div>
          <p className="text-lg mb-2">开始新对话</p>
          <p className="text-sm text-gray-400">在下方输入框中输入消息</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {sortedMessages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            isLast={index === sortedMessages.length - 1 && !isThinking}
          />
        ))}
        {/* 思考中指示器 */}
        {isThinking && (
          <div className="flex items-start gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm">🤖</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium">Claude</span>
                <span>正在思考...</span>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 滚动到底部按钮 */}
      {showScrollButton && (
        <button
          onClick={() => {
            scrollToBottom()
            setIsAutoScrolling(true)
          }}
          className={cn(
            'absolute bottom-4 right-4 p-2 rounded-full shadow-lg',
            'bg-white dark:bg-gray-800 border',
            'hover:bg-gray-50 dark:hover:bg-gray-700',
            'transition-all duration-200',
            'animate-bounce'
          )}
          title="滚动到底部"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
