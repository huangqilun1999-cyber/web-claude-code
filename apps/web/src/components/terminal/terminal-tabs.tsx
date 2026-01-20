'use client'

import { useTerminalStore } from '@/stores/terminal-store'
import { X, Terminal as TerminalIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TerminalTabsProps {
  onClose: (id: string) => void
}

export function TerminalTabs({ onClose }: TerminalTabsProps) {
  const { terminals, activeTerminalId, setActiveTerminal } = useTerminalStore()

  return (
    <div className="flex-1 flex overflow-x-auto">
      {terminals.map((terminal) => (
        <div
          key={terminal.id}
          className={cn(
            'flex items-center gap-2 px-3 py-2 cursor-pointer border-r border-gray-700',
            'hover:bg-gray-700',
            activeTerminalId === terminal.id && 'bg-gray-900'
          )}
          onClick={() => setActiveTerminal(terminal.id)}
        >
          <TerminalIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-300">{terminal.name}</span>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose(terminal.id)
            }}
            className="p-0.5 rounded hover:bg-gray-600"
          >
            <X className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      ))}
    </div>
  )
}
