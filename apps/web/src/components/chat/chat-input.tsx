'use client'

import { useState, useRef, useCallback, KeyboardEvent, useEffect } from 'react'
import { Send, Paperclip, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (content: string) => void
  onStop?: () => void
  disabled?: boolean
  isStreaming?: boolean
  placeholder?: string
  maxLength?: number
}

export function ChatInput({
  onSend,
  onStop,
  disabled,
  isStreaming,
  placeholder,
  maxLength = 10000,
}: ChatInputProps) {
  const [content, setContent] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 自动聚焦
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [disabled])

  const handleSend = useCallback(() => {
    const trimmed = content.trim()
    if (!trimmed || disabled || isStreaming) return

    onSend(trimmed)
    setContent('')

    // 重置textarea高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [content, disabled, isStreaming, onSend])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter发送，Shift+Enter换行
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }

      // Ctrl+Enter 或 Cmd+Enter 也可以发送
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleSend()
      }

      // Escape 停止生成
      if (e.key === 'Escape' && isStreaming && onStop) {
        e.preventDefault()
        onStop()
      }
    },
    [handleSend, isStreaming, onStop]
  )

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    // 可以在这里处理粘贴图片等
    const items = e.clipboardData?.items
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          // TODO: 处理粘贴的图片
          console.log('Image pasted')
        }
      }
    }
  }, [])

  const characterCount = content.length
  const isNearLimit = characterCount > maxLength * 0.9
  const isOverLimit = characterCount > maxLength

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'relative flex items-end gap-2 rounded-lg border transition-all',
          isFocused && 'ring-2 ring-blue-500 border-blue-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              if (e.target.value.length <= maxLength) {
                setContent(e.target.value)
              }
            }}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onPaste={handlePaste}
            placeholder={placeholder || '输入消息...'}
            disabled={disabled}
            rows={1}
            className={cn(
              'w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-16 sm:pr-20 rounded-lg resize-none bg-transparent',
              'text-base sm:text-sm', // 移动端16px防止iOS缩放
              'focus:outline-none',
              'disabled:cursor-not-allowed',
              'placeholder:text-gray-400'
            )}
            style={{ minHeight: '44px', maxHeight: '200px' }}
          />

          {/* 右侧按钮组 */}
          <div className="absolute right-1.5 sm:right-2 bottom-1.5 sm:bottom-2 flex items-center gap-1">
            {/* 附件按钮 */}
            <button
              type="button"
              className={cn(
                'p-2 rounded-lg transition-colors touch-manipulation',
                'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                'dark:hover:bg-gray-700',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              disabled={disabled}
              title="添加附件"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 发送/停止按钮 */}
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className={cn(
              'p-2.5 sm:p-3 m-1 rounded-lg transition-colors touch-manipulation',
              'bg-red-500 text-white hover:bg-red-600',
              'flex-shrink-0'
            )}
            title="停止生成 (Esc)"
          >
            <Square className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={disabled || !content.trim() || isOverLimit}
            className={cn(
              'p-2.5 sm:p-3 m-1 rounded-lg transition-colors flex-shrink-0 touch-manipulation',
              'bg-blue-500 text-white hover:bg-blue-600',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500'
            )}
            title="发送消息 (Enter)"
          >
            <Send className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 字符计数和提示 */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <div className="hidden sm:flex items-center gap-2">
          <span>Enter 发送 / Shift+Enter 换行</span>
          {isStreaming && <span className="text-orange-500">按 Esc 停止生成</span>}
        </div>
        {/* 移动端显示简化提示 */}
        <div className="sm:hidden">
          {isStreaming && <span className="text-orange-500">点击红色按钮停止</span>}
        </div>
        <span
          className={cn(
            isNearLimit && 'text-orange-500',
            isOverLimit && 'text-red-500'
          )}
        >
          {characterCount} / {maxLength}
        </span>
      </div>
    </div>
  )
}
