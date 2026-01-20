'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useWS } from '@/lib/websocket'
import { useAgentStore, useSelectedAgent } from '@/stores/agent-store'
import { MobileNav } from './mobile-nav'
import {
  Wifi,
  WifiOff,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Moon,
  Sun,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function DashboardHeader() {
  const { data: session } = useSession()
  const { isConnected, isConnecting, connect, resetReconnect } = useWS()
  const { agents, selectedAgentId, setSelectedAgent } = useAgentStore()
  const selectedAgent = useSelectedAgent()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isDark, setIsDark] = useState(false)

  const handleToggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  const handleReconnect = () => {
    resetReconnect()
    connect()
  }

  const onlineAgents = agents.filter((a) => a.isOnline)

  return (
    <header className="h-14 border-b bg-white dark:bg-gray-900 flex items-center justify-between px-4 flex-shrink-0 safe-area-top">
      {/* Logo 和连接状态 */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile menu button */}
        <MobileNav />

        <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          <span className="hidden sm:inline">Web Claude Code</span>
          <span className="sm:hidden">WCC</span>
        </h1>

        <div
          className={cn(
            'flex items-center gap-1.5 text-sm px-2 py-1 rounded-full',
            isConnected
              ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
              : isConnecting
              ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
              : 'text-red-600 bg-red-50 dark:bg-red-900/20'
          )}
        >
          {isConnected ? (
            <Wifi className="w-4 h-4" />
          ) : isConnecting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          <span className="text-xs font-medium">
            {isConnected ? '已连接' : isConnecting ? '连接中...' : '未连接'}
          </span>
          {!isConnected && !isConnecting && (
            <button
              onClick={handleReconnect}
              className="ml-1 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
              title="重新连接"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 中间：Agent选择器 - hidden on mobile */}
      <div className="hidden md:flex items-center gap-4">
        <div className="relative">
          <select
            value={selectedAgentId || ''}
            onChange={(e) => setSelectedAgent(e.target.value || null)}
            className={cn(
              'appearance-none bg-gray-100 dark:bg-gray-800 rounded-lg',
              'px-4 py-2 pr-10 text-sm min-w-[200px]',
              'border border-transparent focus:border-blue-500 focus:outline-none',
              'cursor-pointer'
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

        {selectedAgent && (
          <div className="text-xs text-gray-500">
            {selectedAgent.currentDirectory && (
              <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {selectedAgent.currentDirectory}
              </span>
            )}
          </div>
        )}

        <div className="text-xs text-gray-400">
          {onlineAgents.length} / {agents.length} 在线
        </div>
      </div>

      {/* 右侧：用户菜单 */}
      <div className="flex items-center gap-2">
        {/* 主题切换 */}
        <button
          onClick={handleToggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={isDark ? '切换到亮色模式' : '切换到暗色模式'}
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {/* 用户菜单 */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            onBlur={() => setTimeout(() => setShowUserMenu(false), 200)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
              {session?.user?.name?.[0] || session?.user?.email?.[0] || 'U'}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {/* 下拉菜单 */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 overflow-hidden z-50">
              <div className="p-3 border-b dark:border-gray-700">
                <div className="font-medium text-sm">
                  {session?.user?.name || '用户'}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {session?.user?.email}
                </div>
              </div>
              <div className="p-1">
                <a
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-500" />
                  设置
                </a>
                <a
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <User className="w-4 h-4 text-gray-500" />
                  个人资料
                </a>
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
