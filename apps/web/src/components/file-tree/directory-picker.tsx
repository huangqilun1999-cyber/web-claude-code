'use client'

import { useState, useEffect } from 'react'
import { FolderOpen, Loader2, FolderTree, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWS } from '@/lib/websocket'
import { useAgentStore } from '@/stores/agent-store'
import { useFileStore } from '@/stores/file-store'

interface FileItem {
  name: string
  path: string
  type: 'file' | 'directory'
}

export function DirectoryPicker() {
  const { send, subscribe, isConnected } = useWS()
  const { selectedAgentId, agents } = useAgentStore()
  const { setRootPath } = useFileStore()
  const [isLoading, setIsLoading] = useState(false)
  const [files, setFiles] = useState<FileItem[]>([])
  const [currentPath, setCurrentPath] = useState('')
  const [inputPath, setInputPath] = useState('')

  const selectedAgent = agents.find(a => a.id === selectedAgentId)

  // 监听文件列表响应
  useEffect(() => {
    const unsub = subscribe('server:file_result', (message) => {
      const { success, data, error, action } = message.payload

      if (action !== 'list') return

      if (success && data?.files) {
        setFiles(data.files)
        setCurrentPath(data.path || '')
        setInputPath(data.path || '')
      } else if (!success) {
        console.error('File list error:', error)
      }
      setIsLoading(false)
    })

    return () => unsub()
  }, [subscribe])

  // 加载目录
  const loadDirectory = (path: string) => {
    if (!selectedAgentId || !isConnected) return

    console.log('[DirectoryPicker] loadDirectory called with path:', path)
    setIsLoading(true)
    send('client:file', {
      agentId: selectedAgentId,
      action: 'list',
      path: path || '~',
    })
  }

  // 首次加载默认目录
  const handleStartBrowsing = () => {
    loadDirectory('~')
  }

  // 选择目录
  const handleSelectFolder = (path: string) => {
    loadDirectory(path)
  }

  // 返回上级目录
  const handleGoUp = () => {
    if (!currentPath || currentPath === '/') return
    const parent = currentPath.split(/[/\\]/).slice(0, -1).join('/') || '/'
    loadDirectory(parent)
  }

  // 确认选择当前目录
  const handleConfirm = () => {
    if (currentPath) {
      setRootPath(currentPath)
    }
  }

  // 直接输入路径
  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputPath.trim()) {
      loadDirectory(inputPath.trim())
    }
  }

  // 没有选择 Agent 时的提示
  if (!selectedAgentId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <FolderTree className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          请先选择 Agent
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          连接后才能浏览文件
        </p>
      </div>
    )
  }

  // Agent 不在线时的提示
  if (!selectedAgent?.isOnline) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <FolderTree className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Agent 已离线
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          等待重新连接
        </p>
      </div>
    )
  }

  // 未开始浏览时显示开始按钮
  if (!currentPath && files.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col h-full p-4">
        <div className="flex items-center gap-2 mb-4">
          <FolderTree className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            选择项目目录
          </h3>
        </div>

        {/* 直接输入路径 */}
        <form onSubmit={handleInputSubmit} className="mb-3">
          <input
            type="text"
            value={inputPath}
            onChange={(e) => setInputPath(e.target.value)}
            placeholder="输入路径..."
            className={cn(
              'w-full px-3 py-2 border rounded-lg text-sm mb-2',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              'dark:bg-gray-700 dark:border-gray-600'
            )}
          />
          <button
            type="submit"
            disabled={!inputPath.trim() || !isConnected}
            className={cn(
              'w-full px-4 py-2 bg-blue-500 text-white rounded-lg text-sm',
              'hover:bg-blue-600 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            打开
          </button>
        </form>

        <div className="text-xs text-gray-400 text-center mb-3">或</div>

        <button
          onClick={handleStartBrowsing}
          disabled={!isConnected}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm',
            'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600',
            'transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <FolderOpen className="w-4 h-4" />
          浏览目录
        </button>

        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          输入 Agent 电脑上的项目路径，或点击浏览选择目录
        </p>
      </div>
    )
  }

  // 目录浏览器
  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">选择项目目录</span>
        </div>

        {/* 当前路径显示 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGoUp}
            disabled={!currentPath || currentPath === '/' || isLoading}
            className={cn(
              'p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            title="上级目录"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <div className="flex-1 text-sm text-gray-600 dark:text-gray-400 truncate">
            {currentPath || '...'}
          </div>
        </div>
      </div>

      {/* 目录列表 */}
      <div className="flex-1 overflow-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-0.5">
            {files
              .filter(f => f.type === 'directory')
              .map((file) => (
                <button
                  key={file.path}
                  onClick={() => handleSelectFolder(file.path)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg',
                    'text-left text-sm',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    'transition-colors'
                  )}
                >
                  <FolderOpen className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                </button>
              ))}
            {files.filter(f => f.type === 'directory').length === 0 && (
              <div className="text-sm text-gray-500 text-center py-4">
                此目录下没有子文件夹
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="p-3 border-t flex items-center justify-between gap-2">
        <button
          onClick={() => {
            setCurrentPath('')
            setFiles([])
            setInputPath('')
          }}
          className="px-4 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          取消
        </button>
        <button
          onClick={handleConfirm}
          disabled={!currentPath}
          className={cn(
            'px-4 py-2 text-sm bg-blue-500 text-white rounded-lg',
            'hover:bg-blue-600 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          选择此目录
        </button>
      </div>
    </div>
  )
}
