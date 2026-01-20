'use client'

import { useState, useCallback } from 'react'
import { useWS } from '@/lib/websocket'
import { useAgentStore } from '@/stores/agent-store'
import { useFileStore } from '@/stores/file-store'
import { useGitStore } from '@/stores/git-store'
import { GitBranch, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GitBranchesProps {
  onSwitch?: () => void
}

export function GitBranches({ onSwitch }: GitBranchesProps) {
  const { send, isConnected } = useWS()
  const { selectedAgentId } = useAgentStore()
  const { rootPath } = useFileStore()
  const { branches } = useGitStore()
  const [isOpen, setIsOpen] = useState(false)

  const currentBranch = branches.find((b) => b.current)

  const handleSwitchBranch = useCallback(
    (branchName: string) => {
      if (!selectedAgentId || !isConnected || !rootPath) return

      send('client:git', {
        agentId: selectedAgentId,
        action: 'checkout',
        workingDirectory: rootPath,
        params: { branch: branchName },
      })

      setIsOpen(false)
      setTimeout(() => onSwitch?.(), 1000)
    },
    [selectedAgentId, isConnected, rootPath, send, onSwitch]
  )

  if (branches.length === 0) {
    return null
  }

  return (
    <div className="p-3">
      <h3 className="font-medium mb-2 flex items-center gap-2">
        <GitBranch className="w-4 h-4" />
        <span>分支</span>
      </h3>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <span>{currentBranch?.name || '选择分支'}</span>
          <ChevronDown
            className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')}
          />
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-48 overflow-auto">
            {branches.map((branch) => (
              <button
                key={branch.name}
                onClick={() => handleSwitchBranch(branch.name)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700',
                  branch.current && 'bg-blue-50 dark:bg-blue-900/20'
                )}
              >
                {branch.current && <Check className="w-4 h-4 text-blue-500" />}
                <span className={cn(!branch.current && 'ml-6')}>
                  {branch.name}
                </span>
                {branch.remote && (
                  <span className="text-xs text-gray-500">({branch.remote})</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
