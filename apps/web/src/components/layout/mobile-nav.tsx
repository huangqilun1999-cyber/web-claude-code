'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  MessageSquare,
  Bot,
  History,
  LayoutTemplate,
  Puzzle,
  Settings,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAgentStore, useSelectedAgent } from '@/stores/agent-store'

const navItems = [
  { href: '/workspace', icon: MessageSquare, label: '工作区' },
  { href: '/agents', icon: Bot, label: 'Agent' },
  { href: '/history', icon: History, label: '历史' },
  { href: '/templates', icon: LayoutTemplate, label: '模板' },
  { href: '/plugins', icon: Puzzle, label: '插件' },
  { href: '/settings', icon: Settings, label: '设置' },
]

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { agents, selectedAgentId, setSelectedAgent } = useAgentStore()
  const selectedAgent = useSelectedAgent()
  const onlineAgents = agents.filter((a) => a.isOnline)

  return (
    <>
      {/* 汉堡菜单按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 md:hidden touch-manipulation"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* 抽屉 */}
      {isOpen && (
        <>
          {/* 遮罩 */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* 侧边栏 */}
          <div className="fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] bg-white dark:bg-gray-900 shadow-xl animate-in slide-in-from-left duration-300 safe-area-left">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">Web Claude Code</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Agent 选择器 */}
            <div className="p-3 border-b">
              <div className="text-xs text-gray-500 mb-2 flex items-center justify-between">
                <span>Agent 选择</span>
                <span>{onlineAgents.length} / {agents.length} 在线</span>
              </div>
              <div className="relative">
                <select
                  value={selectedAgentId || ''}
                  onChange={(e) => setSelectedAgent(e.target.value || null)}
                  className={cn(
                    'appearance-none w-full bg-gray-100 dark:bg-gray-800 rounded-lg',
                    'px-3 py-2.5 pr-10 text-sm',
                    'border border-transparent focus:border-blue-500 focus:outline-none',
                    'cursor-pointer touch-manipulation'
                  )}
                >
                  <option value="">选择 Agent</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id} disabled={!agent.isOnline}>
                      {agent.name} {agent.isOnline ? '🟢' : '🔴'}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
              {selectedAgent?.currentDirectory && (
                <div className="mt-2 text-xs text-gray-500 truncate font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {selectedAgent.currentDirectory}
                </div>
              )}
            </div>

            <nav className="p-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3.5 rounded-lg touch-manipulation',
                      'transition-colors',
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
