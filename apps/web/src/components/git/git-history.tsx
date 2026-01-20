'use client'

import { useGitStore } from '@/stores/git-store'
import { GitCommit } from 'lucide-react'

export function GitHistory() {
  const { commits } = useGitStore()

  if (commits.length === 0) {
    return null
  }

  return (
    <div className="p-3">
      <h3 className="font-medium mb-2 flex items-center gap-2">
        <GitCommit className="w-4 h-4" />
        <span>提交历史</span>
      </h3>

      <div className="space-y-2 max-h-48 overflow-auto">
        {commits.map((commit) => (
          <div
            key={commit.hash}
            className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs text-blue-500">
                {commit.shortHash || commit.hash.substring(0, 7)}
              </span>
              <span className="text-xs text-gray-500">{commit.date}</span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 truncate">
              {commit.message}
            </p>
            <p className="text-xs text-gray-500">{commit.author}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
