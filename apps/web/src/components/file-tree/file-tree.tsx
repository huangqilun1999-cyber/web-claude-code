'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useWS } from '@/lib/websocket'
import { useFileStore, FileNode } from '@/stores/file-store'
import { useAgentStore } from '@/stores/agent-store'
import { FileNodeItem } from './file-node'
import { DirectoryPicker } from './directory-picker'
import { FolderOpen, RefreshCw } from 'lucide-react'
import { cn, getLanguageFromExtension } from '@/lib/utils'

interface FileTreeProps {
  className?: string
}

export function FileTree({ className }: FileTreeProps) {
  const { send, subscribe, isConnected } = useWS()
  const { selectedAgentId } = useAgentStore()
  const {
    rootPath,
    fileTree,
    isLoadingTree,
    setFileTree,
    setLoadingTree,
    setFolderChildren,
    setFolderLoading,
    toggleFolder,
    openFile,
  } = useFileStore()

  // 跟踪当前加载的目录路径
  const loadingPathRef = useRef<string | null>(null)

  // 加载根目录
  const loadRootDirectory = useCallback(
    (path: string) => {
      if (!selectedAgentId || !isConnected) return

      loadingPathRef.current = path || '.'
      setLoadingTree(true)
      try {
        send('client:file', {
          agentId: selectedAgentId,
          action: 'list',
          path: path || '.',
        })
      } catch (error) {
        console.error('Failed to load directory:', error)
        setLoadingTree(false)
      }
    },
    [selectedAgentId, isConnected, send, setLoadingTree]
  )

  // 加载子目录
  const loadDirectory = useCallback(
    (path: string) => {
      if (!selectedAgentId || !isConnected) return

      loadingPathRef.current = path
      setFolderLoading(path, true)
      try {
        send('client:file', {
          agentId: selectedAgentId,
          action: 'list',
          path,
        })
      } catch (error) {
        console.error('Failed to load directory:', error)
        setFolderLoading(path, false)
      }
    },
    [selectedAgentId, isConnected, send, setFolderLoading]
  )

  // 订阅文件列表响应
  useEffect(() => {
    if (!rootPath) return // 如果没有 rootPath，不订阅

    const unsubscribe = subscribe('server:file_result', (message) => {
      const { success, data, error, action } = message.payload

      if (!success) {
        console.error('File operation failed:', error)
        setLoadingTree(false)
        return
      }

      // 处理文件列表响应
      if (action === 'list' && data?.files) {
        const files: FileNode[] = data.files.map((f: any) => ({
          name: f.name,
          path: f.path,
          type: f.type,
          size: f.size,
          modifiedAt: f.modifiedAt,
          extension: f.extension,
          children: f.type === 'directory' ? undefined : undefined,
        }))

        // 判断是根目录还是子目录
        if (data.path === rootPath || data.path === loadingPathRef.current) {
          if (isLoadingTree) {
            setFileTree(files)
            setLoadingTree(false)
          } else {
            setFolderChildren(data.path, files)
          }
        } else {
          setFolderChildren(data.path, files)
        }
      }

      // 处理文件内容响应
      if (action === 'read' && data?.content !== undefined) {
        const language = getLanguageFromExtension(data.extension || '')
        openFile({
          path: data.path,
          name: data.name,
          content: data.content,
          language,
          isDirty: false,
          originalContent: data.content,
        })
      }
    })

    return unsubscribe
  }, [subscribe, rootPath, isLoadingTree, setFileTree, setLoadingTree, setFolderChildren, openFile])

  // 初始加载
  useEffect(() => {
    if (rootPath && selectedAgentId && isConnected) {
      loadRootDirectory(rootPath)
    }
  }, [rootPath, selectedAgentId, isConnected, loadRootDirectory])

  // 处理文件夹点击
  const handleFolderClick = useCallback(
    (node: FileNode) => {
      if (node.children) {
        toggleFolder(node.path)
      } else {
        loadDirectory(node.path)
      }
    },
    [toggleFolder, loadDirectory]
  )

  // 处理文件点击
  const handleFileClick = useCallback(
    (node: FileNode) => {
      if (!selectedAgentId || !isConnected) return

      // 读取文件内容
      send('client:file', {
        agentId: selectedAgentId,
        action: 'read',
        path: node.path,
      })
    },
    [selectedAgentId, isConnected, send]
  )

  // 如果没有设置 rootPath，显示目录选择器
  if (!rootPath) {
    return <DirectoryPicker />
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FolderOpen className="w-4 h-4" />
          <span className="truncate">{rootPath || '文件'}</span>
        </div>
        <button
          onClick={() => loadRootDirectory(rootPath)}
          disabled={isLoadingTree}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <RefreshCw
            className={cn('w-4 h-4', isLoadingTree && 'animate-spin')}
          />
        </button>
      </div>

      {/* 文件树 */}
      <div className="flex-1 overflow-auto p-2">
        {isLoadingTree ? (
          <div className="text-sm text-gray-500 text-center py-4">
            加载中...
          </div>
        ) : fileTree.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">
            暂无文件
          </div>
        ) : (
          <div className="space-y-0.5">
            {fileTree.map((node) => (
              <FileNodeItem
                key={node.path}
                node={node}
                depth={0}
                onFolderClick={handleFolderClick}
                onFileClick={handleFileClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
