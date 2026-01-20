'use client'

import { memo } from 'react'
import { FileNode } from '@/stores/file-store'
import { FileIcon } from './file-icons'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileNodeItemProps {
  node: FileNode
  depth: number
  onFolderClick: (node: FileNode) => void
  onFileClick: (node: FileNode) => void
}

export const FileNodeItem = memo(function FileNodeItem({
  node,
  depth,
  onFolderClick,
  onFileClick,
}: FileNodeItemProps) {
  const isFolder = node.type === 'directory'
  const paddingLeft = depth * 12 + 8

  const handleClick = () => {
    if (isFolder) {
      onFolderClick(node)
    } else {
      onFileClick(node)
    }
  }

  return (
    <>
      <div
        onClick={handleClick}
        className={cn(
          'flex items-center gap-1 py-1 px-2 rounded cursor-pointer',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'text-sm'
        )}
        style={{ paddingLeft }}
      >
        {/* 展开/折叠图标 */}
        {isFolder ? (
          node.isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : node.isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )
        ) : (
          <span className="w-4" />
        )}

        {/* 文件/文件夹图标 */}
        {isFolder ? (
          node.isExpanded ? (
            <FolderOpen className="w-4 h-4 text-yellow-500" />
          ) : (
            <Folder className="w-4 h-4 text-yellow-500" />
          )
        ) : (
          <FileIcon extension={node.extension || ''} />
        )}

        {/* 文件名 */}
        <span className="truncate">{node.name}</span>
      </div>

      {/* 子节点 */}
      {isFolder && node.isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileNodeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              onFolderClick={onFolderClick}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </>
  )
})
