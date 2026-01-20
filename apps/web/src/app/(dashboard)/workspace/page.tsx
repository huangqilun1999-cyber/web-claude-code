'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useWS } from '@/lib/websocket'
import { useAgentStore } from '@/stores/agent-store'
import { useFileStore } from '@/stores/file-store'
import { ChatContainer } from '@/components/chat/chat-container'
import { FileTree, FileTreeToolbar } from '@/components/file-tree'
import { CodeEditor } from '@/components/editor'
import { GitPanel } from '@/components/git'
import { ResizablePanel } from '@/components/layout'
import { MessageSquare, Code2, FolderTree, Terminal, GitBranch } from 'lucide-react'

const TerminalContainer = dynamic(
  () => import('@/components/terminal/terminal-container').then((m) => m.TerminalContainer),
  { ssr: false }
)

type ViewType = 'chat' | 'editor' | 'terminal' | 'git'

export default function WorkspacePage() {
  const { subscribe } = useWS()
  const { updateAgentStatus, addAgent, setAgents, selectedAgentId, setSelectedAgent } = useAgentStore()
  const { setRootPath } = useFileStore()
  const [view, setView] = useState<ViewType>('chat')
  // 移动端默认隐藏文件树
  const [showFileTree, setShowFileTree] = useState(false)

  // 检测屏幕大小并设置初始值
  useEffect(() => {
    const checkMobile = () => {
      setShowFileTree(window.innerWidth >= 768)
    }
    checkMobile()
    // 不需要监听resize，只在初始化时设置
  }, [])

  // 切换到编辑器视图时，桌面端自动显示文件树
  useEffect(() => {
    if (view === 'editor' && window.innerWidth >= 768) {
      setShowFileTree(true)
    }
  }, [view])

  // 监听Agent状态变化
  useEffect(() => {
    // 订阅 Agent 状态更新
    const unsubStatus = subscribe('server:agent_status', (message) => {
      const { agentId, isOnline, systemInfo } = message.payload
      updateAgentStatus(agentId, isOnline, systemInfo)

      // 设置默认工作目录
      if (isOnline && systemInfo?.homeDir && agentId === selectedAgentId) {
        setRootPath(systemInfo.homeDir)
      }
    })

    // 订阅 Agent 连接事件
    const unsubConnect = subscribe('server:agent_connected', (message) => {
      const { agent } = message.payload
      addAgent({
        id: agent.id,
        name: agent.name || `Agent ${agent.id.slice(0, 8)}`,
        description: agent.description,
        type: agent.type || 'LOCAL',
        isOnline: true,
        lastSeenAt: new Date().toISOString(),
        currentDirectory: agent.currentDirectory,
        systemInfo: agent.systemInfo,
      })
    })

    // 订阅 Agent 断开事件
    const unsubDisconnect = subscribe('server:agent_disconnected', (message) => {
      const { agentId } = message.payload
      updateAgentStatus(agentId, false)
    })

    // 订阅 Agent 列表
    const unsubList = subscribe('server:agent_list', (message) => {
      const { agents } = message.payload
      console.log('[Workspace] Received agent list:', agents)

      const mappedAgents = agents.map((agent: any) => ({
        id: agent.id,
        name: agent.name || `Agent ${agent.id.slice(0, 8)}`,
        description: agent.description,
        type: agent.type || 'LOCAL',
        isOnline: agent.isOnline,
        lastSeenAt: agent.lastSeenAt,
        currentDirectory: agent.currentDirectory,
        systemInfo: agent.systemInfo,
      }))

      setAgents(mappedAgents)

      // 如果没有选中的Agent，自动选择第一个在线的Agent
      if (!selectedAgentId) {
        const onlineAgent = mappedAgents.find((a: any) => a.isOnline)
        if (onlineAgent) {
          console.log('[Workspace] Auto-selecting online agent:', onlineAgent.id)
          setSelectedAgent(onlineAgent.id)
        }
      }
    })

    return () => {
      unsubStatus()
      unsubConnect()
      unsubDisconnect()
      unsubList()
    }
  }, [subscribe, updateAgentStatus, addAgent, setAgents, selectedAgentId, setSelectedAgent, setRootPath])

  return (
    <div className="h-full flex">
      {/* 文件树侧边栏 - 桌面端 */}
      {showFileTree && (
        <>
          {/* 桌面端 - 可调整大小的面板 */}
          <div className="hidden md:block">
            <ResizablePanel
              direction="horizontal"
              initialSize={256}
              minSize={200}
              maxSize={400}
              className="border-r"
            >
              <div className="flex flex-col h-full">
                <FileTreeToolbar />
                <FileTree className="flex-1" />
              </div>
            </ResizablePanel>
          </div>

          {/* 移动端 - 抽屉模式 */}
          <div className="md:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowFileTree(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-white dark:bg-gray-900 shadow-xl animate-in slide-in-from-left duration-300">
              <div className="flex flex-col h-full">
                <FileTreeToolbar onClose={() => setShowFileTree(false)} />
                <FileTree className="flex-1" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 视图切换标签 */}
        <div className="flex items-center border-b bg-gray-50 dark:bg-gray-900 overflow-x-auto scrollbar-hide">
          {/* 文件树切换按钮 */}
          <button
            onClick={() => setShowFileTree(!showFileTree)}
            className={`p-3 border-r hover:bg-gray-100 dark:hover:bg-gray-800 touch-manipulation flex-shrink-0 ${
              showFileTree ? 'text-blue-500' : 'text-gray-500'
            }`}
            title={showFileTree ? '隐藏文件树' : '显示文件树'}
          >
            <FolderTree className="w-4 h-4" />
          </button>

          {/* 视图切换 */}
          <button
            onClick={() => setView('chat')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-sm border-b-2 transition-colors touch-manipulation flex-shrink-0 ${
              view === 'chat'
                ? 'border-blue-500 text-blue-500 bg-white dark:bg-gray-800'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden xs:inline">对话</span>
          </button>
          <button
            onClick={() => setView('editor')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-sm border-b-2 transition-colors touch-manipulation flex-shrink-0 ${
              view === 'editor'
                ? 'border-blue-500 text-blue-500 bg-white dark:bg-gray-800'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span className="hidden xs:inline">编辑器</span>
          </button>
          <button
            onClick={() => setView('terminal')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-sm border-b-2 transition-colors touch-manipulation flex-shrink-0 ${
              view === 'terminal'
                ? 'border-blue-500 text-blue-500 bg-white dark:bg-gray-800'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span className="hidden xs:inline">终端</span>
          </button>
          <button
            onClick={() => setView('git')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-sm border-b-2 transition-colors touch-manipulation flex-shrink-0 ${
              view === 'git'
                ? 'border-blue-500 text-blue-500 bg-white dark:bg-gray-800'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span className="hidden xs:inline">Git</span>
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden">
          {view === 'chat' && <ChatContainer />}
          {view === 'editor' && <CodeEditor />}
          {view === 'terminal' && <TerminalContainer />}
          {view === 'git' && <GitPanel />}
        </div>
      </div>
    </div>
  )
}
