'use client'

import { useActiveFile } from '@/stores/file-store'
import { Save, Undo, Redo, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditorToolbarProps {
  onSave: () => void
}

export function EditorToolbar({ onSave }: EditorToolbarProps) {
  const activeFile = useActiveFile()

  return (
    <div className="flex items-center justify-between px-2 py-1 bg-gray-50 dark:bg-gray-800 border-b">
      <div className="flex items-center gap-1">
        {/* 保存按钮 */}
        <button
          onClick={onSave}
          disabled={!activeFile?.isDirty}
          className={cn(
            'p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            activeFile?.isDirty && 'text-blue-500'
          )}
          title="保存 (Ctrl+S)"
        >
          <Save className="w-4 h-4" />
        </button>

        {/* 撤销 */}
        <button
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="撤销 (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>

        {/* 重做 */}
        <button
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="重做 (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* 搜索 */}
        <button
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="搜索 (Ctrl+F)"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* 文件信息 */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {activeFile && (
          <>
            <span>{activeFile.language}</span>
            <span>•</span>
            <span>UTF-8</span>
            {activeFile.isDirty && (
              <>
                <span>•</span>
                <span className="text-blue-500">已修改</span>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
