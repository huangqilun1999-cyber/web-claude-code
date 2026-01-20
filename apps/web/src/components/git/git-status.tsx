'use client'

import { useGitStore } from '@/stores/git-store'
import { FileText, FilePlus, FileX, Check, AlertCircle } from 'lucide-react'

export function GitStatus() {
  const { status, isLoading } = useGitStore()

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">加载中...</div>
    )
  }

  if (!status) {
    return (
      <div className="p-4 text-center text-gray-500">
        无法获取Git状态
      </div>
    )
  }

  const hasChanges =
    status.staged.length > 0 ||
    status.unstaged.length > 0 ||
    status.untracked.length > 0

  return (
    <div className="p-3">
      <h3 className="font-medium mb-2 flex items-center gap-2">
        {hasChanges ? (
          <>
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            <span>有未提交的更改</span>
          </>
        ) : (
          <>
            <Check className="w-4 h-4 text-green-500" />
            <span>工作区干净</span>
          </>
        )}
      </h3>

      {/* 已暂存 */}
      {status.staged.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm text-gray-500 mb-1">
            已暂存 ({status.staged.length})
          </h4>
          <ul className="space-y-1">
            {status.staged.map((file) => (
              <li
                key={file}
                className="flex items-center gap-2 text-sm text-green-600"
              >
                <FilePlus className="w-4 h-4" />
                <span className="truncate">{file}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 未暂存 */}
      {status.unstaged.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm text-gray-500 mb-1">
            已修改 ({status.unstaged.length})
          </h4>
          <ul className="space-y-1">
            {status.unstaged.map((file) => (
              <li
                key={file}
                className="flex items-center gap-2 text-sm text-yellow-600"
              >
                <FileText className="w-4 h-4" />
                <span className="truncate">{file}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 未跟踪 */}
      {status.untracked.length > 0 && (
        <div>
          <h4 className="text-sm text-gray-500 mb-1">
            未跟踪 ({status.untracked.length})
          </h4>
          <ul className="space-y-1">
            {status.untracked.map((file) => (
              <li
                key={file}
                className="flex items-center gap-2 text-sm text-gray-500"
              >
                <FileX className="w-4 h-4" />
                <span className="truncate">{file}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 同步状态 */}
      {(status.ahead > 0 || status.behind > 0) && (
        <div className="mt-3 text-sm text-gray-500">
          {status.ahead > 0 && <span>↑ {status.ahead} 待推送</span>}
          {status.ahead > 0 && status.behind > 0 && <span> • </span>}
          {status.behind > 0 && <span>↓ {status.behind} 待拉取</span>}
        </div>
      )}
    </div>
  )
}
