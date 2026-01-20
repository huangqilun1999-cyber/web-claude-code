'use client'

import { useState, useEffect } from 'react'
import { X, FolderOpen, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWS } from '@/lib/websocket'
import { useAgentStore } from '@/stores/agent-store'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (name: string, description: string, workingDirectory: string) => void
  editProject?: {
    id: string
    name: string
    description?: string
    workingDirectory: string
  } | null
}

interface FileItem {
  name: string
  path: string
  type: 'file' | 'directory'
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onConfirm,
  editProject,
}: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [workingDirectory, setWorkingDirectory] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [files, setFiles] = useState<FileItem[]>([])
  const [showBrowser, setShowBrowser] = useState(false)
  const [currentPath, setCurrentPath] = useState('')
  const { send, subscribe, isConnected } = useWS()
  const { selectedAgentId, agents } = useAgentStore()

  // 获取当前Agent的主目录作为默认值
  const currentAgent = agents.find((a) => a.id === selectedAgentId)
  const defaultHomeDir = currentAgent?.systemInfo?.homeDir || ''

  useEffect(() => {
    if (editProject) {
      setName(editProject.name)
      setDescription(editProject.description || '')
      setWorkingDirectory(editProject.workingDirectory)
    } else if (isOpen) {
      setName('')
      setDescription('')
      setWorkingDirectory(defaultHomeDir)
    }
  }, [editProject, isOpen, defaultHomeDir])

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
    if (!name.trim() || !workingDirectory.trim()) return
    onConfirm(name.trim(), description.trim(), workingDirectory.trim())
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {editProject ? '编辑项目' : '新建项目'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 项目名称 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              项目名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：My Web App"
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm',
                'bg-white dark:bg-gray-900',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
              autoFocus
            />
          </div>

          {/* 项目描述 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              项目描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简单描述一下这个项目..."
              rows={2}
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm resize-none',
                'bg-white dark:bg-gray-900',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
            />
          </div>

          {/* 工作目录 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              项目路径 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={workingDirectory}
                  onChange={(e) => setWorkingDirectory(e.target.value)}
                  placeholder={defaultHomeDir || '/path/to/project'}
                  className={cn(
                    'w-full pl-9 pr-3 py-2 rounded-lg border text-sm',
                    'bg-white dark:bg-gray-900',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500'
                  )}
                />
              </div>
              <button
                type="button"
                onClick={handleBrowse}
                disabled={!isConnected || !selectedAgentId}
                className={cn(
                  'px-3 py-2 rounded-lg border text-sm',
                  'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                浏览
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              该路径下的所有会话将共享此工作目录
            </p>
          </div>

          {/* 文件浏览器 */}
          {showBrowser && (
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
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium',
                'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
              )}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !workingDirectory.trim()}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium',
                'bg-blue-500 text-white hover:bg-blue-600 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {editProject ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
