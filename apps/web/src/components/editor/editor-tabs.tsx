'use client'

import { useFileStore } from '@/stores/file-store'
import { X, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EditorTabs() {
  const { openFiles, activeFilePath, setActiveFile, closeFile } = useFileStore()

  if (openFiles.length === 0) {
    return null
  }

  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 border-b overflow-x-auto">
      {openFiles.map((file) => (
        <div
          key={file.path}
          className={cn(
            'flex items-center gap-2 px-3 py-2 border-r cursor-pointer min-w-0',
            'hover:bg-gray-200 dark:hover:bg-gray-700',
            activeFilePath === file.path &&
              'bg-white dark:bg-gray-900 border-b-2 border-b-blue-500'
          )}
          onClick={() => setActiveFile(file.path)}
        >
          <span className="text-sm truncate max-w-32">{file.name}</span>

          {/* 未保存指示器 */}
          {file.isDirty && (
            <Circle className="w-2 h-2 fill-current text-blue-500 flex-shrink-0" />
          )}

          {/* 关闭按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (file.isDirty) {
                if (confirm('文件未保存，确定要关闭吗？')) {
                  closeFile(file.path)
                }
              } else {
                closeFile(file.path)
              }
            }}
            className="p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600 flex-shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
