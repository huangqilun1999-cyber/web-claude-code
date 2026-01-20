# Chat 3 提示词：对话功能

## 任务说明
你正在参与开发 "Web Claude Code" 平台。**你的职责**：对话功能的前端开发，包括聊天界面、实时流式输出、会话管理。

## 工作目录
```
d:\github\Web-Claude code\apps\web
```

## 技术栈
- React + TypeScript
- Tailwind CSS + shadcn/ui
- Zustand (状态管理)
- react-markdown + rehype-highlight (Markdown渲染)
- WebSocket客户端

---

## 详细任务清单

### 阶段1：WebSocket客户端Hook

1. **创建 src/hooks/use-websocket.ts**
```typescript
'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'

interface WSMessage {
  id: string
  type: string
  payload: any
  timestamp: number
}

type MessageHandler = (message: WSMessage) => void

export function useWebSocket() {
  const { data: session } = useSession()
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const handlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map())
  const reconnectTimerRef = useRef<NodeJS.Timeout>()

  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN || isConnecting) {
      return
    }

    if (!session?.user) {
      return
    }

    setIsConnecting(true)

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'
      const ws = new WebSocket(`${wsUrl}?type=client`)

      ws.onopen = async () => {
        // 获取JWT token进行认证
        const tokenRes = await fetch('/api/auth/token')
        const { token } = await tokenRes.json()

        ws.send(JSON.stringify({
          id: Date.now().toString(),
          type: 'client:auth',
          payload: { token },
          timestamp: Date.now(),
        }))
      }

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data)

          // 处理认证结果
          if (message.type === 'server:auth_result') {
            if (message.payload.success) {
              setIsConnected(true)
              setIsConnecting(false)
            } else {
              console.error('WebSocket auth failed:', message.payload.error)
              ws.close()
            }
            return
          }

          // 分发消息给订阅者
          const handlers = handlersRef.current.get(message.type)
          if (handlers) {
            handlers.forEach((handler) => handler(message))
          }

          // 也分发给通配符订阅者
          const wildcardHandlers = handlersRef.current.get('*')
          if (wildcardHandlers) {
            wildcardHandlers.forEach((handler) => handler(message))
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        setIsConnecting(false)
        wsRef.current = null

        // 自动重连
        reconnectTimerRef.current = setTimeout(() => {
          connect()
        }, 5000)
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setIsConnecting(false)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      setIsConnecting(false)
    }
  }, [session, isConnecting])

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
    }
    wsRef.current?.close()
    wsRef.current = null
    setIsConnected(false)
  }, [])

  const send = useCallback((type: string, payload: any): string => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected')
    }

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const message = {
      id,
      type,
      payload,
      timestamp: Date.now(),
    }

    wsRef.current.send(JSON.stringify(message))
    return id
  }, [])

  const subscribe = useCallback((type: string, handler: MessageHandler) => {
    if (!handlersRef.current.has(type)) {
      handlersRef.current.set(type, new Set())
    }
    handlersRef.current.get(type)!.add(handler)

    return () => {
      handlersRef.current.get(type)?.delete(handler)
    }
  }, [])

  useEffect(() => {
    if (session?.user) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [session, connect, disconnect])

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    send,
    subscribe,
  }
}
```

2. **创建 src/lib/websocket.ts** (WebSocket context provider)
```typescript
'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useWebSocket } from '@/hooks/use-websocket'

type WebSocketContextType = ReturnType<typeof useWebSocket>

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const ws = useWebSocket()

  return (
    <WebSocketContext.Provider value={ws}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWS() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWS must be used within a WebSocketProvider')
  }
  return context
}
```

---

### 阶段2：会话状态管理

1. **创建 src/stores/session-store.ts**
```typescript
import { create } from 'zustand'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  contentType?: 'text' | 'code' | 'image' | 'file' | 'error'
  isStreaming?: boolean
  createdAt: Date
  metadata?: Record<string, any>
}

export interface Session {
  id: string
  name: string
  agentId?: string
  workingDirectory?: string
  claudeSessionId?: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

interface SessionState {
  sessions: Session[]
  currentSessionId: string | null
  isLoading: boolean
  error: string | null

  // Actions
  setSessions: (sessions: Session[]) => void
  setCurrentSession: (sessionId: string | null) => void
  addSession: (session: Session) => void
  updateSession: (sessionId: string, updates: Partial<Session>) => void
  deleteSession: (sessionId: string) => void

  // Message actions
  addMessage: (sessionId: string, message: Message) => void
  updateMessage: (sessionId: string, messageId: string, updates: Partial<Message>) => void
  appendToMessage: (sessionId: string, messageId: string, content: string) => void
  setMessageStreaming: (sessionId: string, messageId: string, isStreaming: boolean) => void

  // Loading state
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  isLoading: false,
  error: null,

  setSessions: (sessions) => set({ sessions }),

  setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),

  addSession: (session) =>
    set((state) => ({
      sessions: [session, ...state.sessions],
      currentSessionId: session.id,
    })),

  updateSession: (sessionId, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, ...updates, updatedAt: new Date() } : s
      ),
    })),

  deleteSession: (sessionId) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
      currentSessionId:
        state.currentSessionId === sessionId
          ? state.sessions[0]?.id || null
          : state.currentSessionId,
    })),

  addMessage: (sessionId, message) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, messages: [...s.messages, message], updatedAt: new Date() }
          : s
      ),
    })),

  updateMessage: (sessionId, messageId, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages: s.messages.map((m) =>
                m.id === messageId ? { ...m, ...updates } : m
              ),
            }
          : s
      ),
    })),

  appendToMessage: (sessionId, messageId, content) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages: s.messages.map((m) =>
                m.id === messageId ? { ...m, content: m.content + content } : m
              ),
            }
          : s
      ),
    })),

  setMessageStreaming: (sessionId, messageId, isStreaming) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages: s.messages.map((m) =>
                m.id === messageId ? { ...m, isStreaming } : m
              ),
            }
          : s
      ),
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
}))

// Selector hooks
export const useCurrentSession = () => {
  const { sessions, currentSessionId } = useSessionStore()
  return sessions.find((s) => s.id === currentSessionId)
}

export const useCurrentMessages = () => {
  const session = useCurrentSession()
  return session?.messages || []
}
```

---

### 阶段3：聊天组件

1. **创建 src/components/chat/chat-container.tsx**
```typescript
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useWS } from '@/lib/websocket'
import { useSessionStore, useCurrentSession, useCurrentMessages, Message } from '@/stores/session-store'
import { useAgentStore } from '@/stores/agent-store'
import { MessageList } from './message-list'
import { ChatInput } from './chat-input'
import { SessionList } from './session-list'

export function ChatContainer() {
  const { isConnected, send, subscribe } = useWS()
  const currentSession = useCurrentSession()
  const messages = useCurrentMessages()
  const { selectedAgentId } = useAgentStore()
  const {
    addMessage,
    appendToMessage,
    setMessageStreaming,
    updateSession,
  } = useSessionStore()

  const streamingMessageIdRef = useRef<string | null>(null)

  // 订阅流式消息
  useEffect(() => {
    const unsubStream = subscribe('server:stream', (message) => {
      const { sessionId, content, contentType, isPartial } = message.payload

      if (currentSession?.id !== sessionId) return

      if (!streamingMessageIdRef.current) {
        // 创建新的助手消息
        const msgId = `assistant-${Date.now()}`
        streamingMessageIdRef.current = msgId

        addMessage(sessionId, {
          id: msgId,
          role: 'assistant',
          content: '',
          contentType: contentType || 'text',
          isStreaming: true,
          createdAt: new Date(),
        })
      }

      // 追加内容
      appendToMessage(sessionId, streamingMessageIdRef.current, content)
    })

    const unsubComplete = subscribe('server:complete', (message) => {
      const { sessionId, claudeSessionId } = message.payload

      if (currentSession?.id === sessionId && streamingMessageIdRef.current) {
        setMessageStreaming(sessionId, streamingMessageIdRef.current, false)
        streamingMessageIdRef.current = null

        // 更新会话的Claude Session ID
        if (claudeSessionId) {
          updateSession(sessionId, { claudeSessionId })
        }
      }
    })

    const unsubError = subscribe('server:error', (message) => {
      console.error('Server error:', message.payload)
      if (streamingMessageIdRef.current && currentSession?.id) {
        setMessageStreaming(currentSession.id, streamingMessageIdRef.current, false)
        streamingMessageIdRef.current = null
      }
    })

    return () => {
      unsubStream()
      unsubComplete()
      unsubError()
    }
  }, [currentSession?.id, subscribe, addMessage, appendToMessage, setMessageStreaming, updateSession])

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!currentSession || !selectedAgentId || !isConnected) {
        return
      }

      // 添加用户消息
      const userMessageId = `user-${Date.now()}`
      addMessage(currentSession.id, {
        id: userMessageId,
        role: 'user',
        content,
        createdAt: new Date(),
      })

      // 发送到服务器
      try {
        send('client:execute', {
          agentId: selectedAgentId,
          sessionId: currentSession.id,
          prompt: content,
          workingDirectory: currentSession.workingDirectory,
        })
      } catch (error) {
        console.error('Failed to send message:', error)
      }
    },
    [currentSession, selectedAgentId, isConnected, send, addMessage]
  )

  return (
    <div className="flex h-full">
      {/* 会话列表侧边栏 */}
      <div className="w-64 border-r bg-gray-50 dark:bg-gray-900">
        <SessionList />
      </div>

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            {/* 消息列表 */}
            <div className="flex-1 overflow-hidden">
              <MessageList messages={messages} />
            </div>

            {/* 输入框 */}
            <div className="border-t p-4">
              <ChatInput
                onSend={handleSendMessage}
                disabled={!isConnected || !selectedAgentId}
                placeholder={
                  !isConnected
                    ? '正在连接服务器...'
                    : !selectedAgentId
                    ? '请先选择一个Agent'
                    : '输入消息...'
                }
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            选择或创建一个会话开始对话
          </div>
        )}
      </div>
    </div>
  )
}
```

2. **创建 src/components/chat/message-list.tsx**
```typescript
'use client'

import { useEffect, useRef } from 'react'
import { Message } from '@/stores/session-store'
import { MessageItem } from './message-item'

interface MessageListProps {
  messages: Message[]
}

export function MessageList({ messages }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">开始新对话</p>
          <p className="text-sm">在下方输入框中输入消息</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
```

3. **创建 src/components/chat/message-item.tsx**
```typescript
'use client'

import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import { Message } from '@/stores/session-store'
import { cn } from '@/lib/utils'
import { User, Bot, Loader2 } from 'lucide-react'

interface MessageItemProps {
  message: Message
}

export const MessageItem = memo(function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-lg',
        isUser ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800/50'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isUser ? 'bg-blue-500' : 'bg-purple-500'
        )}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm mb-1">
          {isUser ? '你' : 'Claude'}
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          {isAssistant ? (
            <ReactMarkdown
              rehypePlugins={[rehypeHighlight]}
              components={{
                pre: ({ children }) => (
                  <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    {children}
                  </pre>
                ),
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '')
                  const isInline = !match

                  if (isInline) {
                    return (
                      <code
                        className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  }

                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {/* Streaming indicator */}
        {message.isStreaming && (
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>正在输入...</span>
          </div>
        )}
      </div>
    </div>
  )
})
```

4. **创建 src/components/chat/chat-input.tsx**
```typescript
'use client'

import { useState, useRef, useCallback, KeyboardEvent } from 'react'
import { Send, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (content: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const trimmed = content.trim()
    if (!trimmed || disabled) return

    onSend(trimmed)
    setContent('')

    // 重置textarea高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [content, disabled, onSend])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [])

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={placeholder || '输入消息...'}
          disabled={disabled}
          rows={1}
          className={cn(
            'w-full px-4 py-3 pr-12 rounded-lg border resize-none',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'dark:bg-gray-800 dark:border-gray-700'
          )}
          style={{ minHeight: '48px', maxHeight: '200px' }}
        />

        {/* 附件按钮 */}
        <button
          type="button"
          className="absolute right-3 bottom-3 text-gray-400 hover:text-gray-600"
          disabled={disabled}
        >
          <Paperclip className="w-5 h-5" />
        </button>
      </div>

      {/* 发送按钮 */}
      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || !content.trim()}
        className={cn(
          'p-3 rounded-lg transition-colors',
          'bg-blue-500 text-white hover:bg-blue-600',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  )
}
```

5. **创建 src/components/chat/session-list.tsx**
```typescript
'use client'

import { useCallback } from 'react'
import { useSessionStore } from '@/stores/session-store'
import { useAgentStore } from '@/stores/agent-store'
import { Plus, MessageSquare, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

export function SessionList() {
  const {
    sessions,
    currentSessionId,
    setCurrentSession,
    addSession,
    deleteSession,
  } = useSessionStore()
  const { selectedAgentId } = useAgentStore()

  const handleCreateSession = useCallback(() => {
    if (!selectedAgentId) {
      alert('请先选择一个Agent')
      return
    }

    const newSession = {
      id: `session-${Date.now()}`,
      name: `新会话 ${sessions.length + 1}`,
      agentId: selectedAgentId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    addSession(newSession)
  }, [selectedAgentId, sessions.length, addSession])

  const handleDeleteSession = useCallback(
    (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation()
      if (confirm('确定要删除这个会话吗？')) {
        deleteSession(sessionId)
      }
    },
    [deleteSession]
  )

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="p-4 border-b">
        <button
          onClick={handleCreateSession}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg',
            'bg-blue-500 text-white hover:bg-blue-600 transition-colors'
          )}
        >
          <Plus className="w-4 h-4" />
          <span>新会话</span>
        </button>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            暂无会话
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setCurrentSession(session.id)}
                className={cn(
                  'group flex items-center gap-3 p-3 rounded-lg cursor-pointer',
                  'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                  currentSessionId === session.id &&
                    'bg-blue-100 dark:bg-blue-900/30'
                )}
              >
                <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {session.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {session.messages.length} 条消息
                  </div>
                </div>

                <button
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  className={cn(
                    'opacity-0 group-hover:opacity-100 p-1 rounded',
                    'hover:bg-red-100 dark:hover:bg-red-900/30 transition-all'
                  )}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

### 阶段4：Agent状态管理

1. **创建 src/stores/agent-store.ts**
```typescript
import { create } from 'zustand'

export interface Agent {
  id: string
  name: string
  description?: string
  type: 'LOCAL' | 'SERVER'
  isOnline: boolean
  lastSeenAt?: string
  currentDirectory?: string
  systemInfo?: Record<string, any>
}

interface AgentState {
  agents: Agent[]
  selectedAgentId: string | null
  isLoading: boolean
  error: string | null

  // Actions
  setAgents: (agents: Agent[]) => void
  setSelectedAgent: (agentId: string | null) => void
  updateAgentStatus: (agentId: string, isOnline: boolean, systemInfo?: Record<string, any>) => void
  addAgent: (agent: Agent) => void
  removeAgent: (agentId: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  selectedAgentId: null,
  isLoading: false,
  error: null,

  setAgents: (agents) => set({ agents }),

  setSelectedAgent: (agentId) => set({ selectedAgentId: agentId }),

  updateAgentStatus: (agentId, isOnline, systemInfo) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId
          ? {
              ...a,
              isOnline,
              lastSeenAt: isOnline ? new Date().toISOString() : a.lastSeenAt,
              systemInfo: systemInfo || a.systemInfo,
            }
          : a
      ),
    })),

  addAgent: (agent) =>
    set((state) => ({
      agents: [...state.agents, agent],
    })),

  removeAgent: (agentId) =>
    set((state) => ({
      agents: state.agents.filter((a) => a.id !== agentId),
      selectedAgentId:
        state.selectedAgentId === agentId ? null : state.selectedAgentId,
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
}))

// Selector hooks
export const useSelectedAgent = () => {
  const { agents, selectedAgentId } = useAgentStore()
  return agents.find((a) => a.id === selectedAgentId)
}

export const useOnlineAgents = () => {
  const { agents } = useAgentStore()
  return agents.filter((a) => a.isOnline)
}
```

---

### 阶段5：工作区页面

1. **更新 src/app/(dashboard)/workspace/page.tsx**
```typescript
'use client'

import { useEffect } from 'react'
import { useWS } from '@/lib/websocket'
import { useAgentStore } from '@/stores/agent-store'
import { ChatContainer } from '@/components/chat/chat-container'

export default function WorkspacePage() {
  const { subscribe } = useWS()
  const { updateAgentStatus } = useAgentStore()

  // 监听Agent状态变化
  useEffect(() => {
    const unsubscribe = subscribe('server:agent_status', (message) => {
      const { agentId, isOnline, systemInfo } = message.payload
      updateAgentStatus(agentId, isOnline, systemInfo)
    })

    return unsubscribe
  }, [subscribe, updateAgentStatus])

  return (
    <div className="h-full">
      <ChatContainer />
    </div>
  )
}
```

2. **创建 src/app/(dashboard)/layout.tsx**
```typescript
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { WebSocketProvider } from '@/lib/websocket'
import { DashboardHeader } from '@/components/layout/header'
import { DashboardSidebar } from '@/components/layout/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <WebSocketProvider>
      <div className="h-screen flex flex-col">
        <DashboardHeader />
        <div className="flex-1 flex overflow-hidden">
          <DashboardSidebar />
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </WebSocketProvider>
  )
}
```

---

### 阶段6：布局组件

1. **创建 src/components/layout/header.tsx**
```typescript
'use client'

import { useSession, signOut } from 'next-auth/react'
import { useWS } from '@/lib/websocket'
import { useAgentStore, useSelectedAgent } from '@/stores/agent-store'
import { Wifi, WifiOff, ChevronDown, LogOut, Settings, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DashboardHeader() {
  const { data: session } = useSession()
  const { isConnected } = useWS()
  const { agents, selectedAgentId, setSelectedAgent } = useAgentStore()
  const selectedAgent = useSelectedAgent()

  return (
    <header className="h-14 border-b bg-white dark:bg-gray-900 flex items-center justify-between px-4">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold">Web Claude Code</h1>
        <div
          className={cn(
            'flex items-center gap-1 text-sm',
            isConnected ? 'text-green-500' : 'text-red-500'
          )}
        >
          {isConnected ? (
            <Wifi className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          <span>{isConnected ? '已连接' : '未连接'}</span>
        </div>
      </div>

      {/* Agent选择器 */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <select
            value={selectedAgentId || ''}
            onChange={(e) => setSelectedAgent(e.target.value || null)}
            className="appearance-none bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 pr-8 text-sm"
          >
            <option value="">选择Agent</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} {agent.isOnline ? '(在线)' : '(离线)'}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>

        {/* 用户菜单 */}
        <div className="relative group">
          <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
              {session?.user?.name?.[0] || session?.user?.email?.[0] || 'U'}
            </div>
          </button>

          {/* 下拉菜单 */}
          <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <div className="p-3 border-b">
              <div className="font-medium">{session?.user?.name || '用户'}</div>
              <div className="text-sm text-gray-500">{session?.user?.email}</div>
            </div>
            <div className="p-1">
              <a
                href="/settings"
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <Settings className="w-4 h-4" />
                设置
              </a>
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-500"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
```

2. **创建 src/components/layout/sidebar.tsx**
```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageSquare,
  FolderTree,
  Terminal,
  GitBranch,
  LayoutTemplate,
  Puzzle,
  Bot,
  Settings,
  History,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/workspace', icon: MessageSquare, label: '工作区' },
  { href: '/agents', icon: Bot, label: 'Agent管理' },
  { href: '/history', icon: History, label: '历史记录' },
  { href: '/templates', icon: LayoutTemplate, label: '项目模板' },
  { href: '/plugins', icon: Puzzle, label: '插件市场' },
  { href: '/settings', icon: Settings, label: '设置' },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-16 border-r bg-gray-50 dark:bg-gray-900 flex flex-col items-center py-4">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'w-12 h-12 rounded-lg flex items-center justify-center mb-2',
              'transition-colors hover:bg-gray-200 dark:hover:bg-gray-800',
              isActive && 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
            )}
            title={item.label}
          >
            <Icon className="w-6 h-6" />
          </Link>
        )
      })}
    </aside>
  )
}
```

---

### 阶段7：添加API路由获取Token

1. **创建 src/app/api/auth/token/route.ts**
```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
)

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 生成WebSocket认证用的JWT
    const token = await new SignJWT({
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(JWT_SECRET)

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Token generation error:', error)
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
  }
}
```

---

## 输出要求

1. WebSocket连接稳定
2. 消息实时显示
3. 流式输出正常
4. 会话管理完整

## 完成标志

- [ ] WebSocket hook完成
- [ ] 会话状态管理完成
- [ ] 聊天界面完成
- [ ] 消息列表渲染正常
- [ ] 流式输出正常
- [ ] 会话切换正常

## 注意事项

1. **WebSocket重连**要稳定
2. **流式消息**要正确追加
3. 状态管理要高效
4. 移动端也要可用
