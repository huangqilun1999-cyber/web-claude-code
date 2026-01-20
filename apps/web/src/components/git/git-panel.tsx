'use client'

import { useEffect, useCallback } from 'react'
import { useWS } from '@/lib/websocket'
import { useAgentStore } from '@/stores/agent-store'
import { useFileStore } from '@/stores/file-store'
import { useGitStore } from '@/stores/git-store'
import { GitStatus } from './git-status'
import { GitBranches } from './git-branches'
import { GitCommitForm } from './git-commit-form'
import { GitHistory } from './git-history'
import { RefreshCw, GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils'

export function GitPanel() {
  const { send, subscribe, isConnected } = useWS()
  const { selectedAgentId } = useAgentStore()
  const { rootPath } = useFileStore()
  const { status, isLoading, setStatus, setBranches, setCommits, setLoading, setError } =
    useGitStore()

  // 加载Git状态
  const loadStatus = useCallback(() => {
    if (!selectedAgentId || !isConnected || !rootPath) return

    setLoading(true)
    send('client:git', {
      agentId: selectedAgentId,
      action: 'status',
      workingDirectory: rootPath,
    })
  }, [selectedAgentId, isConnected, rootPath, send, setLoading])

  // 加载分支列表
  const loadBranches = useCallback(() => {
    if (!selectedAgentId || !isConnected || !rootPath) return

    send('client:git', {
      agentId: selectedAgentId,
      action: 'branch',
      workingDirectory: rootPath,
    })
  }, [selectedAgentId, isConnected, rootPath, send])

  // 加载提交历史
  const loadHistory = useCallback(() => {
    if (!selectedAgentId || !isConnected || !rootPath) return

    send('client:git', {
      agentId: selectedAgentId,
      action: 'log',
      workingDirectory: rootPath,
      params: { limit: 20 },
    })
  }, [selectedAgentId, isConnected, rootPath, send])

  // 订阅Git操作结果
  useEffect(() => {
    const unsubscribe = subscribe('server:git_result', (message) => {
      const { success, data, error } = message.payload

      setLoading(false)

      if (!success) {
        setError(error || '操作失败')
        return
      }

      if (data?.status) {
        setStatus(data.status)
      }
      if (data?.branches) {
        setBranches(data.branches)
      }
      if (data?.commits) {
        setCommits(data.commits)
      }
    })

    return unsubscribe
  }, [subscribe, setStatus, setBranches, setCommits, setLoading, setError])

  // 初始加载
  useEffect(() => {
    if (rootPath) {
      loadStatus()
      loadBranches()
      loadHistory()
    }
  }, [rootPath, loadStatus, loadBranches, loadHistory])

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5" />
          <span className="font-medium">Git</span>
          {status && (
            <span className="text-sm text-gray-500">({status.branch})</span>
          )}
        </div>

        <button
          onClick={loadStatus}
          disabled={isLoading}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <RefreshCw
            className={cn('w-4 h-4', isLoading && 'animate-spin')}
          />
        </button>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-auto">
        {!rootPath ? (
          <div className="p-4 text-center text-gray-500">
            请先选择工作目录
          </div>
        ) : (
          <div className="divide-y">
            <GitStatus />
            <GitCommitForm onCommit={loadStatus} />
            <GitBranches onSwitch={loadStatus} />
            <GitHistory />
          </div>
        )}
      </div>
    </div>
  )
}
