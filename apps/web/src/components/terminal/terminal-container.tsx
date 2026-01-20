'use client'

import { useCallback } from 'react'
import { useTerminalStore } from '@/stores/terminal-store'
import { useAgentStore } from '@/stores/agent-store'
import { useWS } from '@/lib/websocket'
import { Terminal } from './terminal'
import { TerminalTabs } from './terminal-tabs'
import { Plus } from 'lucide-react'

export function TerminalContainer() {
  const { send, isConnected } = useWS()
  const { selectedAgentId } = useAgentStore()
  const { terminals, activeTerminalId, addTerminal, removeTerminal } =
    useTerminalStore()

  const handleCreateTerminal = useCallback(() => {
    if (!selectedAgentId || !isConnected) {
      alert('请先连接Agent')
      return
    }

    const id = `terminal-${Date.now()}`
    addTerminal({
      id,
      name: `终端 ${terminals.length + 1}`,
      isActive: true,
      workingDirectory: '~',
    })
  }, [selectedAgentId, isConnected, terminals.length, addTerminal])

  const handleCloseTerminal = useCallback(
    (id: string) => {
      if (selectedAgentId && isConnected) {
        send('client:terminal', {
          agentId: selectedAgentId,
          action: 'close',
          terminalId: id,
        })
      }
      removeTerminal(id)
    },
    [selectedAgentId, isConnected, send, removeTerminal]
  )

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* 标签栏 */}
      <div className="flex items-center bg-gray-800 border-b border-gray-700">
        <TerminalTabs onClose={handleCloseTerminal} />

        <button
          onClick={handleCreateTerminal}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700"
          title="新建终端"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* 终端区域 */}
      <div className="flex-1 relative">
        {terminals.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="mb-2">没有打开的终端</p>
              <button
                onClick={handleCreateTerminal}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                新建终端
              </button>
            </div>
          </div>
        ) : (
          terminals.map((terminal) => (
            <Terminal
              key={terminal.id}
              terminalId={terminal.id}
              isActive={terminal.id === activeTerminalId}
            />
          ))
        )}
      </div>
    </div>
  )
}
