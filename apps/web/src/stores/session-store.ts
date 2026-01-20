import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  contentType?: 'text' | 'code' | 'image' | 'file' | 'error' | 'question' | 'tool_call' | 'tool_result'
  isStreaming?: boolean
  createdAt: Date
  sequence?: number  // 消息序列号，用于确保正确的显示顺序
  metadata?: Record<string, any>
}

export type PermissionMode = 'plan' | 'bypassPermissions' | 'askEdits' | 'autoEdits'

export interface Session {
  id: string
  name: string
  projectId?: string  // 所属项目ID
  agentId?: string
  workingDirectory?: string
  claudeSessionId?: string
  permissionMode: PermissionMode
  lastPermissionMode?: PermissionMode  // 用于跟踪上次使用的权限模式
  messages: Message[]
  isThinking?: boolean  // 当前会话是否在思考中
  streamingMessageId?: string | null  // 当前正在流式输出的消息ID
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
  replaceSessionId: (oldId: string, newId: string) => void
  deleteSession: (sessionId: string) => void
  clearSessions: () => void

  // Message actions
  addMessage: (sessionId: string, message: Message) => void
  updateMessage: (sessionId: string, messageId: string, updates: Partial<Message>) => void
  appendToMessage: (sessionId: string, messageId: string, content: string) => void
  setMessageStreaming: (sessionId: string, messageId: string, isStreaming: boolean) => void
  deleteMessage: (sessionId: string, messageId: string) => void
  clearMessages: (sessionId: string) => void

  // Session state actions
  setSessionThinking: (sessionId: string, isThinking: boolean) => void
  setSessionStreamingMessageId: (sessionId: string, messageId: string | null) => void

  // Loading state
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
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
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s

            // 如果权限模式改变，清除 claudeSessionId 以开始新的 Claude 会话
            const newUpdates = { ...updates }
            if (updates.permissionMode && updates.permissionMode !== s.permissionMode) {
              newUpdates.claudeSessionId = undefined
            }

            return { ...s, ...newUpdates, updatedAt: new Date() }
          }),
        })),

      replaceSessionId: (oldId, newId) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === oldId ? { ...s, id: newId, updatedAt: new Date() } : s
          ),
          currentSessionId: state.currentSessionId === oldId ? newId : state.currentSessionId,
        })),

      deleteSession: (sessionId) =>
        set((state) => {
          const filteredSessions = state.sessions.filter((s) => s.id !== sessionId)
          return {
            sessions: filteredSessions,
            currentSessionId:
              state.currentSessionId === sessionId
                ? filteredSessions[0]?.id || null
                : state.currentSessionId,
          }
        }),

      clearSessions: () =>
        set({
          sessions: [],
          currentSessionId: null,
        }),

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

      deleteMessage: (sessionId, messageId) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: s.messages.filter((m) => m.id !== messageId),
                  updatedAt: new Date(),
                }
              : s
          ),
        })),

      clearMessages: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, messages: [], updatedAt: new Date() }
              : s
          ),
        })),

      setSessionThinking: (sessionId, isThinking) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, isThinking }
              : s
          ),
        })),

      setSessionStreamingMessageId: (sessionId, messageId) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, streamingMessageId: messageId }
              : s
          ),
        })),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),
    }),
    {
      name: 'session-storage',
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
      }),
    }
  )
)

// Selector hooks
export const useCurrentSession = () => {
  const { sessions, currentSessionId } = useSessionStore()
  return sessions.find((s) => s.id === currentSessionId)
}

export const useCurrentMessages = () => {
  const session = useCurrentSession()
  return session?.messages || []
}

export const useSessionById = (sessionId: string | null) => {
  const { sessions } = useSessionStore()
  if (!sessionId) return null
  return sessions.find((s) => s.id === sessionId)
}
