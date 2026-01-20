'use client'

import { useState, useCallback } from 'react'
import { useWS } from '@/lib/websocket'
import { useAgentStore } from '@/stores/agent-store'
import { useFileStore } from '@/stores/file-store'
import { useGitStore } from '@/stores/git-store'

interface GitCommitFormProps {
  onCommit?: () => void
}

export function GitCommitForm({ onCommit }: GitCommitFormProps) {
  const { send, isConnected } = useWS()
  const { selectedAgentId } = useAgentStore()
  const { rootPath } = useFileStore()
  const { status, setLoading } = useGitStore()
  const [message, setMessage] = useState('')
  const [isCommitting, setIsCommitting] = useState(false)

  const hasChanges =
    status &&
    (status.staged.length > 0 ||
      status.unstaged.length > 0 ||
      status.untracked.length > 0)

  const handleStageAll = useCallback(() => {
    if (!selectedAgentId || !isConnected || !rootPath) return

    send('client:git', {
      agentId: selectedAgentId,
      action: 'add',
      workingDirectory: rootPath,
      params: { files: ['.'] },
    })

    setTimeout(() => onCommit?.(), 1000)
  }, [selectedAgentId, isConnected, rootPath, send, onCommit])

  const handleCommit = useCallback(async () => {
    if (!selectedAgentId || !isConnected || !rootPath || !message.trim()) return

    setIsCommitting(true)
    setLoading(true)

    try {
      send('client:git', {
        agentId: selectedAgentId,
        action: 'commit',
        workingDirectory: rootPath,
        params: { message: message.trim() },
      })

      setMessage('')
      setTimeout(() => {
        onCommit?.()
        setIsCommitting(false)
      }, 1000)
    } catch (error) {
      console.error('Commit failed:', error)
      setIsCommitting(false)
    }
  }, [selectedAgentId, isConnected, rootPath, message, send, setLoading, onCommit])

  const handlePush = useCallback(() => {
    if (!selectedAgentId || !isConnected || !rootPath) return

    send('client:git', {
      agentId: selectedAgentId,
      action: 'push',
      workingDirectory: rootPath,
    })
  }, [selectedAgentId, isConnected, rootPath, send])

  const handlePull = useCallback(() => {
    if (!selectedAgentId || !isConnected || !rootPath) return

    send('client:git', {
      agentId: selectedAgentId,
      action: 'pull',
      workingDirectory: rootPath,
    })

    setTimeout(() => onCommit?.(), 2000)
  }, [selectedAgentId, isConnected, rootPath, send, onCommit])

  if (!hasChanges && !status?.ahead && !status?.behind) {
    return null
  }

  return (
    <div className="p-3">
      {hasChanges && (
        <>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="提交信息..."
            className="w-full px-3 py-2 border rounded-lg resize-none text-sm"
            rows={3}
          />

          <div className="flex gap-2 mt-2">
            <button
              onClick={handleStageAll}
              className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              暂存全部
            </button>
            <button
              onClick={handleCommit}
              disabled={!message.trim() || isCommitting}
              className="flex-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isCommitting ? '提交中...' : '提交'}
            </button>
          </div>
        </>
      )}

      {(status?.ahead || status?.behind) && (
        <div className="flex gap-2 mt-2">
          {status.ahead > 0 && (
            <button
              onClick={handlePush}
              className="flex-1 px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              推送 ({status.ahead})
            </button>
          )}
          {status.behind > 0 && (
            <button
              onClick={handlePull}
              className="flex-1 px-3 py-1.5 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              拉取 ({status.behind})
            </button>
          )}
        </div>
      )}
    </div>
  )
}
