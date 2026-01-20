'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useWS } from '@/lib/websocket'
import { useSessionStore, useCurrentSession, useCurrentMessages, Message } from '@/stores/session-store'
import { useAgentStore } from '@/stores/agent-store'
import { MessageList } from './message-list'
import { ChatInput } from './chat-input'
import { SessionList } from './session-list'
import { generateId, cn } from '@/lib/utils'
import { FolderOpen, MessageSquare, X, ChevronDown } from 'lucide-react'
import { PermissionModeSelector } from './permission-mode-selector'
import { PermissionMode } from '@/stores/session-store'
import { UserInputDialog, InputRequest } from './user-input-dialog'

// 全局消息序列号计数器（模块级别，不会因组件重渲染而重置）
let globalMessageSequence = Date.now()
function getNextSequence(): number {
  globalMessageSequence += 1
  return globalMessageSequence
}

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
    updateMessage,
    replaceSessionId,
    setSessionThinking,
    setSessionStreamingMessageId,
  } = useSessionStore()

  const [inputRequest, setInputRequest] = useState<InputRequest | null>(null)
  const [showMobileSessionList, setShowMobileSessionList] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const currentSessionRef = useRef(currentSession)

  // 从当前会话获取 isThinking 状态
  const isThinking = currentSession?.isThinking || false

  // 保持 ref 同步
  useEffect(() => {
    currentSessionRef.current = currentSession
  }, [currentSession])

  // 订阅流式消息
  useEffect(() => {
    const unsubStream = subscribe('server:stream', (message) => {
      const { sessionId, content, contentType, isPartial, seq } = message.payload

      console.log('[Stream] Received:', { sessionId, content: content?.substring(0, 50), seq, currentSessionId: currentSessionRef.current?.id })

      // 使用消息中的 sessionId，不依赖于当前会话
      // 收到流式消息，关闭该会话的思考状态
      setSessionThinking(sessionId, false)

      // 获取该会话的当前 streamingMessageId
      const session = useSessionStore.getState().sessions.find(s => s.id === sessionId)
      const streamingMessageId = session?.streamingMessageId

      if (!streamingMessageId) {
        // 创建新的助手消息，使用服务器时间戳
        const msgId = `assistant-${generateId()}`
        setSessionStreamingMessageId(sessionId, msgId)

        addMessage(sessionId, {
          id: msgId,
          role: 'assistant',
          content: '',
          contentType: contentType || 'text',
          isStreaming: true,
          createdAt: message.timestamp ? new Date(message.timestamp) : new Date(),
          sequence: seq || getNextSequence(),
        })

        // 追加内容到新创建的消息
        appendToMessage(sessionId, msgId, content)
      } else {
        // 追加内容到现有消息
        appendToMessage(sessionId, streamingMessageId, content)
      }
    })

    const unsubComplete = subscribe('server:complete', (message) => {
      const { sessionId, claudeSessionId, content, usage } = message.payload

      console.log('[Complete] Received:', { sessionId, content: content?.substring(0, 100), currentSessionId: currentSessionRef.current?.id })

      // 使用消息中的 sessionId，不依赖于当前会话
      // 完成时关闭该会话的思考状态
      setSessionThinking(sessionId, false)

      // 获取该会话的当前 streamingMessageId
      const session = useSessionStore.getState().sessions.find(s => s.id === sessionId)
      const streamingMessageId = session?.streamingMessageId

      // 如果有 content 但还没有创建消息（没有通过 stream 接收），直接创建完整消息
      if (content && !streamingMessageId) {
        const msgId = `assistant-${generateId()}`
        addMessage(sessionId, {
          id: msgId,
          role: 'assistant',
          content: content,
          contentType: 'text',
          isStreaming: false,
          createdAt: message.timestamp ? new Date(message.timestamp) : new Date(),
          sequence: getNextSequence(),
          metadata: usage ? { usage } : undefined,
        })
      } else if (streamingMessageId) {
        // 如果有正在流式输出的消息，完成它
        // 注意：不再追加 content，因为 stream 已经输出了完整内容
        setMessageStreaming(sessionId, streamingMessageId, false)

        if (usage) {
          updateMessage(sessionId, streamingMessageId, {
            metadata: { usage }
          })
        }

        setSessionStreamingMessageId(sessionId, null)
      }

      // 更新会话的Claude Session ID
      if (claudeSessionId) {
        updateSession(sessionId, { claudeSessionId })
      }
    })

    const unsubError = subscribe('server:error', (message) => {
      const { sessionId, error, code } = message.payload
      console.error('Server error:', error, code)

      // 使用消息中的 sessionId，不依赖于当前会话
      // 错误时关闭该会话的思考状态
      setSessionThinking(sessionId, false)

      // 获取该会话的当前 streamingMessageId
      const session = useSessionStore.getState().sessions.find(s => s.id === sessionId)
      const streamingMessageId = session?.streamingMessageId

      if (streamingMessageId) {
        // 更新正在流式输出的消息为错误状态
        updateMessage(sessionId, streamingMessageId, {
          isStreaming: false,
          contentType: 'error',
          content: `错误: ${error}`,
        })
        setSessionStreamingMessageId(sessionId, null)
      } else {
        // 添加一条错误消息，使用服务器时间戳
        addMessage(sessionId, {
          id: `error-${generateId()}`,
          role: 'system',
          content: `错误: ${error}`,
          contentType: 'error',
          createdAt: message.timestamp ? new Date(message.timestamp) : new Date(),
          sequence: getNextSequence(),
        })
      }
    })

    // 订阅工具调用事件
    const unsubToolCall = subscribe('server:tool_call', (message) => {
      const { sessionId, toolName, toolArgs, toolUseId, content, seq } = message.payload

      console.log('[ToolCall] Received:', { sessionId, toolName, content, seq, timestamp: message.timestamp })

      // 添加工具调用消息到对应会话，使用 Agent 的序列号确保正确排序
      addMessage(sessionId, {
        id: `tool-call-${toolUseId || generateId()}`,
        role: 'system',
        content: content || `🔧 调用工具: ${toolName}`,
        contentType: 'tool_call',
        createdAt: message.timestamp ? new Date(message.timestamp) : new Date(),
        sequence: seq || getNextSequence(),
        metadata: { toolName, toolArgs, toolUseId },
      })
    })

    // 订阅工具执行结果事件
    const unsubToolResult = subscribe('server:tool_result', (message) => {
      const { sessionId, toolName, toolUseId, content, isError, seq } = message.payload

      console.log('[ToolResult] Received:', { sessionId, toolName, content, isError, seq, timestamp: message.timestamp })

      // 添加工具结果消息到对应会话，使用 Agent 的序列号确保正确排序
      addMessage(sessionId, {
        id: `tool-result-${toolUseId || generateId()}`,
        role: 'system',
        content: content || (isError ? `❌ ${toolName} 执行失败` : `✅ ${toolName} 完成`),
        contentType: isError ? 'error' : 'tool_result',
        createdAt: message.timestamp ? new Date(message.timestamp) : new Date(),
        sequence: seq || getNextSequence(),
        metadata: { toolName, toolUseId, isError },
      })
    })

    // 订阅任务中止事件
    const unsubAborted = subscribe('server:aborted', (message) => {
      const { sessionId, success } = message.payload

      console.log('[Aborted] Received:', { sessionId, success })

      // 关闭该会话的思考状态
      setSessionThinking(sessionId, false)

      // 获取该会话的当前 streamingMessageId
      const session = useSessionStore.getState().sessions.find(s => s.id === sessionId)
      const streamingMessageId = session?.streamingMessageId

      if (streamingMessageId) {
        setMessageStreaming(sessionId, streamingMessageId, false)
        appendToMessage(sessionId, streamingMessageId, '\n\n[任务已中止]')
        setSessionStreamingMessageId(sessionId, null)
      } else {
        // 添加中止消息
        addMessage(sessionId, {
          id: `aborted-${generateId()}`,
          role: 'system',
          content: '⏹️ 任务已中止',
          createdAt: message.timestamp ? new Date(message.timestamp) : new Date(),
          sequence: getNextSequence(),
        })
      }
    })

    // 订阅会话创建事件（服务器返回新的数据库sessionId）
    const unsubSessionCreated = subscribe('server:session_created', (message) => {
      const { frontendSessionId, sessionId, name } = message.payload

      console.log('[SessionCreated] Received:', { frontendSessionId, sessionId, currentSessionId: currentSessionRef.current?.id })

      // 如果当前会话就是被替换的会话，更新本地ID
      if (currentSessionRef.current?.id === frontendSessionId) {
        console.log('[SessionCreated] Replacing session ID:', frontendSessionId, '->', sessionId)
        replaceSessionId(frontendSessionId, sessionId)
      }
    })

    // 订阅思考状态事件
    const unsubThinking = subscribe('server:thinking', (message) => {
      const { sessionId, status } = message.payload

      console.log('[Thinking] Received:', { sessionId, status, currentSessionId: currentSessionRef.current?.id })

      // 使用消息中的 sessionId，更新对应会话的思考状态
      if (status === 'start') {
        setSessionThinking(sessionId, true)
      } else if (status === 'end') {
        setSessionThinking(sessionId, false)
      }
    })

    // 订阅用户输入请求事件
    const unsubInputRequired = subscribe('server:input_required', (message) => {
      const { sessionId, requestId, questions, seq } = message.payload

      console.log('[InputRequired] Received:', { sessionId, requestId, questions, seq })

      // 使用消息中的 sessionId
      // 思考结束
      setSessionThinking(sessionId, false)

      // 获取该会话的当前 streamingMessageId
      const session = useSessionStore.getState().sessions.find(s => s.id === sessionId)
      const streamingMessageId = session?.streamingMessageId

      // 如果有正在流式输出的消息，标记为完成
      if (streamingMessageId) {
        setMessageStreaming(sessionId, streamingMessageId, false)
        setSessionStreamingMessageId(sessionId, null)
      }

      // 只在当前会话显示输入对话框
      if (currentSessionRef.current?.id !== sessionId) return

      // 将问题添加到消息列表
      const questionContent = questions.map((q: { question: string; header?: string; options?: Array<{ label: string; description?: string }> }) => {
        let text = q.question
        if (q.options && q.options.length > 0) {
          text += '\n\n选项:\n' + q.options.map((opt: { label: string; description?: string }, i: number) =>
            `${i + 1}. ${opt.label}${opt.description ? ` - ${opt.description}` : ''}`
          ).join('\n')
        }
        return text
      }).join('\n\n---\n\n')

      addMessage(sessionId, {
        id: `question-${generateId()}`,
        role: 'assistant',
        content: questionContent,
        contentType: 'question',
        createdAt: message.timestamp ? new Date(message.timestamp) : new Date(),
        sequence: seq || getNextSequence(),
        metadata: { questions, requestId },
      })

      // 显示输入对话框
      setInputRequest({
        requestId,
        sessionId,
        questions,
      })
    })

    return () => {
      unsubStream()
      unsubComplete()
      unsubError()
      unsubToolCall()
      unsubToolResult()
      unsubAborted()
      unsubSessionCreated()
      unsubThinking()
      unsubInputRequired()
    }
  }, [subscribe, addMessage, appendToMessage, setMessageStreaming, updateSession, updateMessage, replaceSessionId, setSessionThinking, setSessionStreamingMessageId])

  const handleSendMessage = useCallback(
    async (content: string) => {
      // 使用 ref 获取最新的 session 数据，避免闭包中的旧值问题
      const session = currentSessionRef.current

      console.log('[Chat] handleSendMessage called:', {
        content,
        sessionId: session?.id,
        permissionMode: session?.permissionMode,
        selectedAgentId,
        isConnected,
      })

      if (!session || !selectedAgentId || !isConnected) {
        console.log('[Chat] Cannot send - missing:', {
          hasSession: !!session,
          hasAgent: !!selectedAgentId,
          isConnected,
        })
        return
      }

      // 添加用户消息
      const userMessageId = `user-${generateId()}`
      addMessage(session.id, {
        id: userMessageId,
        role: 'user',
        content,
        createdAt: new Date(),
        sequence: getNextSequence(),
      })

      // 开始该会话的思考状态
      setSessionThinking(session.id, true)

      // 发送到服务器
      try {
        const permissionMode = session.permissionMode || 'bypassPermissions'
        console.log('[Chat] Sending with permissionMode:', permissionMode)

        send('client:execute', {
          agentId: selectedAgentId,
          sessionId: session.id,
          prompt: content,
          workingDirectory: session.workingDirectory,
          claudeSessionId: session.claudeSessionId, // 用于会话继续
          permissionMode: permissionMode,
        })
      } catch (error) {
        console.error('Failed to send message:', error)
        setSessionThinking(session.id, false)
        addMessage(session.id, {
          id: `error-${generateId()}`,
          role: 'system',
          content: '发送消息失败，请检查网络连接',
          contentType: 'error',
          createdAt: new Date(),
          sequence: getNextSequence(),
        })
      }
    },
    [selectedAgentId, isConnected, send, addMessage, setSessionThinking]
  )

  const handleStopGeneration = useCallback(() => {
    if (!currentSession || !selectedAgentId) return

    try {
      send('client:abort', {
        agentId: selectedAgentId,
        sessionId: currentSession.id,
      })

      const streamingMessageId = currentSession.streamingMessageId
      if (streamingMessageId) {
        setMessageStreaming(currentSession.id, streamingMessageId, false)
        appendToMessage(currentSession.id, streamingMessageId, '\n\n[生成已停止]')
        setSessionStreamingMessageId(currentSession.id, null)
      }
    } catch (error) {
      console.error('Failed to stop generation:', error)
    }
  }, [currentSession, selectedAgentId, send, setMessageStreaming, appendToMessage, setSessionStreamingMessageId])

  // 处理用户输入响应 - 将用户答案作为新消息发送给 Claude
  const handleInputResponse = useCallback((requestId: string, answers: Record<string, string | string[]>) => {
    if (!currentSession || !selectedAgentId || !isConnected) return

    console.log('[InputResponse] Processing:', { requestId, answers })

    // 格式化用户的回答为文本消息
    const formattedAnswers: string[] = []
    const questions = inputRequest?.questions || []

    Object.entries(answers).forEach(([key, value]) => {
      const qIndex = parseInt(key.replace('q', ''), 10)
      const question = questions[qIndex]

      if (question) {
        const answerText = Array.isArray(value) ? value.join('、') : value
        formattedAnswers.push(`${question.header || '回答'}: ${answerText}`)
      } else {
        const answerText = Array.isArray(value) ? value.join('、') : value
        formattedAnswers.push(answerText)
      }
    })

    // 构建回复消息
    const responseMessage = formattedAnswers.length > 0
      ? formattedAnswers.join('\n')
      : '继续'

    // 添加用户消息到列表
    const userMessageId = `user-${generateId()}`
    addMessage(currentSession.id, {
      id: userMessageId,
      role: 'user',
      content: responseMessage,
      createdAt: new Date(),
      sequence: getNextSequence(),
    })

    // 开始该会话的思考状态
    setSessionThinking(currentSession.id, true)

    // 发送到服务器作为新消息
    send('client:execute', {
      agentId: selectedAgentId,
      sessionId: currentSession.id,
      prompt: responseMessage,
      workingDirectory: currentSession.workingDirectory,
      claudeSessionId: currentSession.claudeSessionId,
      permissionMode: currentSession.permissionMode || 'bypassPermissions',
    })

    // 关闭对话框
    setInputRequest(null)
  }, [currentSession, selectedAgentId, isConnected, inputRequest, send, addMessage, setSessionThinking])

  const handleInputClose = useCallback(() => {
    if (!currentSession || !selectedAgentId || !isConnected || !inputRequest) {
      setInputRequest(null)
      return
    }

    // 用户跳过输入，发送"跳过"作为新消息
    const skipMessage = '跳过此问题，请继续'

    // 添加用户消息到列表
    const userMessageId = `user-${generateId()}`
    addMessage(currentSession.id, {
      id: userMessageId,
      role: 'user',
      content: skipMessage,
      createdAt: new Date(),
      sequence: getNextSequence(),
    })

    // 开始该会话的思考状态
    setSessionThinking(currentSession.id, true)

    // 发送到服务器作为新消息
    send('client:execute', {
      agentId: selectedAgentId,
      sessionId: currentSession.id,
      prompt: skipMessage,
      workingDirectory: currentSession.workingDirectory,
      claudeSessionId: currentSession.claudeSessionId,
      permissionMode: currentSession.permissionMode || 'bypassPermissions',
    })

    setInputRequest(null)
  }, [currentSession, selectedAgentId, isConnected, inputRequest, send, addMessage, setSessionThinking])

  const isStreaming = messages.some((m) => m.isStreaming)

  return (
    <div className="flex h-full">
      {/* 会话列表侧边栏 - 移动端隐藏 */}
      <div className="hidden md:block w-64 border-r bg-gray-50 dark:bg-gray-900 flex-shrink-0">
        <SessionList />
      </div>

      {/* 移动端会话抽屉 */}
      {showMobileSessionList && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* 遮罩 */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileSessionList(false)}
          />
          {/* 抽屉内容 */}
          <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-white dark:bg-gray-900 shadow-xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">会话列表</h2>
              <button
                onClick={() => setShowMobileSessionList(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-[calc(100%-60px)] overflow-hidden">
              <SessionList onSessionSelect={() => setShowMobileSessionList(false)} />
            </div>
          </div>
        </div>
      )}

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {currentSession ? (
          <>
            {/* 会话头部 - 响应式布局 */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* 移动端会话切换按钮 */}
                <button
                  onClick={() => setShowMobileSessionList(true)}
                  className="md:hidden p-2 -ml-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 touch-manipulation"
                  title="切换会话"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                <span className="font-medium text-sm truncate max-w-[120px] sm:max-w-none">{currentSession.name}</span>
                {currentSession.workingDirectory && (
                  <div className={cn(
                    "hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                    "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  )}>
                    <FolderOpen className="w-3 h-3" />
                    <span className="truncate max-w-[200px] lg:max-w-[300px]">{currentSession.workingDirectory}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <PermissionModeSelector
                  value={currentSession.permissionMode || 'bypassPermissions'}
                  onChange={(mode) => {
                    const oldMode = currentSession.permissionMode || 'bypassPermissions'
                    if (mode !== oldMode) {
                      updateSession(currentSession.id, { permissionMode: mode })
                      const modeNames: Record<string, string> = {
                        plan: 'Plan Mode (规划模式)',
                        bypassPermissions: 'Bypass Permissions (绕过权限)',
                        askEdits: 'Ask Before Edits (编辑前询问)',
                        autoEdits: 'Edit Automatically (自动编辑)',
                      }
                      addMessage(currentSession.id, {
                        id: `system-${generateId()}`,
                        role: 'system',
                        content: `权限模式已切换为: ${modeNames[mode]}，新的对话将使用此模式。`,
                        createdAt: new Date(),
                        sequence: getNextSequence(),
                      })
                    }
                  }}
                  disabled={isStreaming}
                />
                <span className="hidden sm:inline text-xs text-gray-400">
                  {messages.length} 条消息
                </span>
              </div>
            </div>

            {/* 移动端工作目录提示 */}
            {currentSession.workingDirectory && (
              <div className="sm:hidden px-3 py-1.5 border-b bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                  <FolderOpen className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{currentSession.workingDirectory}</span>
                </div>
              </div>
            )}

            {/* 消息列表 */}
            <div className="flex-1 overflow-hidden">
              <MessageList messages={messages} isThinking={isThinking} />
            </div>

            {/* 输入框 - 响应式内边距 */}
            <div className="border-t p-2 sm:p-4 safe-area-bottom">
              <ChatInput
                onSend={handleSendMessage}
                onStop={handleStopGeneration}
                disabled={!isConnected || !selectedAgentId}
                isStreaming={isStreaming}
                placeholder={
                  !isConnected
                    ? '正在连接...'
                    : !selectedAgentId
                    ? '请先选择Agent'
                    : '输入消息...'
                }
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-4">
            {/* 移动端显示会话按钮 */}
            <button
              onClick={() => setShowMobileSessionList(true)}
              className="md:hidden mb-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 touch-manipulation"
            >
              <MessageSquare className="w-5 h-5 inline-block mr-2" />
              查看会话列表
            </button>
            <div className="text-center">
              <div className="text-5xl sm:text-6xl mb-4">💬</div>
              <p className="text-base sm:text-lg mb-2">欢迎使用 Web Claude Code</p>
              <p className="text-xs sm:text-sm">选择或创建一个会话开始对话</p>
            </div>
          </div>
        )}
      </div>

      {/* 用户输入对话框 */}
      <UserInputDialog
        request={inputRequest}
        onSubmit={handleInputResponse}
        onClose={handleInputClose}
      />
    </div>
  )
}
