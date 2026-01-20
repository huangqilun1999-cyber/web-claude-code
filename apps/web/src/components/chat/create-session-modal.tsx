'use client'

import { useState, useEffect } from 'react'
import { X, FolderOpen, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWS } from '@/lib/websocket'
import { useAgentStore } from '@/stores/agent-store'

interface CreateSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (name: string, workingDirectory: string) => void
  defaultWorkingDirectory?: string  // 默认工作目录（从项目继承）
  hideWorkingDirectory?: boolean    // 隐藏工作目录输入（在项目下新建时）
}

interface FileItem {
  name: string
  path: string
  type: 'file' | 'directory'
}

export function CreateSessionModal({
  isOpen,
  onClose,
  onConfirm,
  defaultWorkingDirectory,
  hideWorkingDirectory = false,
}: CreateSessionModalProps) {
  const [name, setName] = useState('')
  const [workingDirectory, setWorkingDirectory] = useState(defaultWorkingDirectory || '')
  const [isLoading, setIsLoading] = useState(false)
  const [files, setFiles] = useState<FileItem[]>([])
  const [showBrowser, setShowBrowser] = useState(false)
  const [currentPath, setCurrentPath] = useState('')
  const { send, subscribe, isConnected } = useWS()
  const { selectedAgentId } = useAgentStore()

  // 当 defaultWorkingDirectory 变化或弹窗打开时，更新工作目录
  useEffect(() => {
    if (isOpen) {
      setWorkingDirectory(defaultWorkingDirectory || '')
      setName('')
    }
  }, [isOpen, defaultWorkingDirectory])

  // 监听文件列表响应
  useEffect(() => {
    if (!isOpen) return

    const unsub = subscribe('server:file_result', (message) => {
      const { success, data, error } = message.payload
      console.log('[FileResult]', { success, data, error })
      if (success && data?.files) {
        setFiles(data.files)
        setCurrentPath(data.path || currentPath)
      } else if (!success) {
        console.error('File list error:', error)
        alert(`获取文件列表失败: ${error || '未知错误'}`)
      }
      setIsLoading(false)
    })

    return () => unsub()
  }, [isOpen, subscribe, currentPath])

  const handleBrowse = () => {
    if (!selectedAgentId || !isConnected) return

    setShowBrowser(true)
    setIsLoading(true)

    // 请求文件列表，从根目录或用户目录开始
    send('client:file', {
      agentId: selectedAgentId,
      action: 'list',
      path: workingDirectory || '~',
    })
  }

  const handleSelectFolder = (path: string) => {
    setIsLoading(true)
    send('client:file', {
      agentId: selectedAgentId,
      action: 'list',
      path,
    })
  }

  const handleConfirmPath = () => {
    setWorkingDirectory(currentPath)
    setShowBrowser(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onConfirm(name.trim(), workingDirectory.trim())
    setName('')
    setWorkingDirectory('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 弹窗 */}
      <div className={cn(
        'relative bg-white dark:bg-gray-800 rounded-lg shadow-xl',
        'w-full max-w-lg mx-4 p-6',
        'animate-in fade-in zoom-in-95 duration-200'
      )}>
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold mb-4">创建新会话</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 会话名称 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              会话名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入会话名称..."
              className={cn(
                'w-full px-3 py-2 border rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                'dark:bg-gray-700 dark:border-gray-600'
              )}
              autoFocus
            />
          </div>

          {/* 工作目录 - 如果是在项目下创建则隐藏 */}
          {!hideWorkingDirectory && (
            <div>
              <label className="block text-sm font-medium mb-1">
                工作目录 <span className="text-gray-400 font-normal">(Agent 电脑上的项目路径)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={workingDirectory}
                  onChange={(e) => setWorkingDirectory(e.target.value)}
                  placeholder="例如: D:\projects\my-app 或 /home/user/projects"
                  className={cn(
                    'flex-1 px-3 py-2 border rounded-lg',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    'dark:bg-gray-700 dark:border-gray-600'
                  )}
                />
                <button
                  type="button"
                  onClick={handleBrowse}
                  disabled={!selectedAgentId || !isConnected}
                  className={cn(
                    'px-3 py-2 border rounded-lg',
                    'hover:bg-gray-50 dark:hover:bg-gray-700',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'flex items-center gap-2'
                  )}
                >
                  <FolderOpen className="w-4 h-4" />
                  浏览
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Claude Code 将在此目录下执行所有操作。留空则使用 Agent 默认目录。
              </p>
            </div>
          )}

          {/* 项目工作目录提示 */}
          {hideWorkingDirectory && defaultWorkingDirectory && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
              <FolderOpen className="w-4 h-4 text-blue-500" />
              <span className="text-blue-700 dark:text-blue-300">
                使用项目目录: {defaultWorkingDirectory}
              </span>
            </div>
          )}

          {/* 文件浏览器 */}
          {!hideWorkingDirectory && showBrowser && (
            <div className="border rounded-lg p-3 dark:border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">选择目录</span>
                <span className="text-xs text-gray-500 truncate ml-2">{currentPath}</span>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                </div>
              ) : (
                <>
                  <div className="max-h-48 overflow-y-auto border rounded dark:border-gray-600">
                    {/* 上级目录 */}
                    {currentPath && currentPath !== '/' && (
                      <button
                        type="button"
                        onClick={() => {
                          const parent = currentPath.split(/[/\\]/).slice(0, -1).join('/') || '/'
                          handleSelectFolder(parent)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm flex items-center gap-2"
                      >
                        <FolderOpen className="w-4 h-4 text-yellow-500" />
                        ..
                      </button>
                    )}
                    {files.filter(f => f.type === 'directory').map((file) => (
                      <button
                        key={file.path}
                        type="button"
                        onClick={() => handleSelectFolder(file.path)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm flex items-center gap-2"
                      >
                        <FolderOpen className="w-4 h-4 text-yellow-500" />
                        {file.name}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowBrowser(false)}
                      className="px-3 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmPath}
                      className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      选择此目录
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 按钮 */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className={cn(
                'px-4 py-2 bg-blue-500 text-white rounded-lg',
                'hover:bg-blue-600 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
