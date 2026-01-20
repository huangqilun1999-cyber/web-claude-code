'use client'

import { useState } from 'react'
import { useWS } from '@/lib/websocket'
import { useFileStore } from '@/stores/file-store'
import { useAgentStore } from '@/stores/agent-store'
import {
  FilePlus,
  FolderPlus,
  Trash2,
  Edit3,
  MoreHorizontal,
  X,
  FolderInput,
} from 'lucide-react'

// 辅助函数：拼接路径，避免双斜杠
function joinPath(base: string, name: string): string {
  if (!base) return name
  const normalizedBase = base.replace(/[/\\]+$/, '') // 移除末尾斜杠
  return `${normalizedBase}/${name}`
}

interface FileTreeToolbarProps {
  onClose?: () => void
}

export function FileTreeToolbar({ onClose }: FileTreeToolbarProps) {
  const { send, isConnected } = useWS()
  const { selectedAgentId } = useAgentStore()
  const { rootPath, setRootPath, closeAllFiles, setFileTree } = useFileStore()
  const [showMenu, setShowMenu] = useState(false)

  // 更改项目目录（清空当前状态，重新选择）
  const handleChangeDirectory = () => {
    // 清空文件树和打开的文件，让 DirectoryPicker 显示
    setRootPath('')
    setFileTree([])
    closeAllFiles()
    setShowMenu(false)
  }

  const handleNewFile = () => {
    const name = prompt('输入文件名：')
    if (!name || !name.trim()) return

    if (!selectedAgentId || !isConnected) {
      alert('请先连接Agent')
      return
    }

    send('client:file', {
      agentId: selectedAgentId,
      action: 'write',
      path: joinPath(rootPath, name.trim()),
      content: '',
    })
  }

  const handleNewFolder = () => {
    const name = prompt('输入文件夹名：')
    if (!name || !name.trim()) return

    if (!selectedAgentId || !isConnected) {
      alert('请先连接Agent')
      return
    }

    send('client:file', {
      agentId: selectedAgentId,
      action: 'mkdir',
      path: joinPath(rootPath, name.trim()),
    })
  }

  return (
    <div className="flex items-center gap-1 p-2 border-b">
      {/* 移动端关闭按钮 */}
      {onClose && (
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 md:hidden touch-manipulation mr-1"
          title="关闭"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <span className="text-sm font-medium md:hidden flex-1">文件</span>

      <button
        onClick={handleNewFile}
        className="p-2 md:p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 touch-manipulation"
        title="新建文件"
      >
        <FilePlus className="w-4 h-4" />
      </button>

      <button
        onClick={handleNewFolder}
        className="p-2 md:p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 touch-manipulation"
        title="新建文件夹"
      >
        <FolderPlus className="w-4 h-4" />
      </button>

      <div className="relative md:ml-auto">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {showMenu && (
          <>
            {/* 点击外部关闭菜单 */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border py-1 z-20">
              <button
                onClick={handleChangeDirectory}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FolderInput className="w-4 h-4" />
                更换项目目录
              </button>
              <div className="border-t my-1 dark:border-gray-700" />
              <button
                onClick={() => {
                  // TODO: 实现重命名
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Edit3 className="w-4 h-4" />
                重命名
              </button>
              <button
                onClick={() => {
                  // TODO: 实现删除
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
