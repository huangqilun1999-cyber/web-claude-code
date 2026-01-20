'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageSquare,
  Bot,
  History,
  LayoutTemplate,
  Puzzle,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  icon: React.ElementType
  label: string
  badge?: number
}

const navItems: NavItem[] = [
  { href: '/workspace', icon: MessageSquare, label: '工作区' },
  { href: '/agents', icon: Bot, label: 'Agent管理' },
  { href: '/history', icon: History, label: '历史记录' },
  { href: '/templates', icon: LayoutTemplate, label: '项目模板' },
  { href: '/plugins', icon: Puzzle, label: '插件市场' },
]

const bottomNavItems: NavItem[] = [
  { href: '/settings', icon: Settings, label: '设置' },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-16 border-r bg-gray-50 dark:bg-gray-900 flex flex-col items-center py-4 flex-shrink-0">
      {/* 主导航 */}
      <nav className="flex-1 flex flex-col items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative w-12 h-12 rounded-xl flex items-center justify-center',
                'transition-all duration-200 group',
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300'
              )}
              title={item.label}
            >
              <Icon className="w-5 h-5" />

              {/* Badge */}
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}

              {/* Tooltip */}
              <span
                className={cn(
                  'absolute left-full ml-2 px-2 py-1 rounded-md text-sm whitespace-nowrap',
                  'bg-gray-900 dark:bg-gray-700 text-white',
                  'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
                  'transition-all duration-200 z-50',
                  'pointer-events-none'
                )}
              >
                {item.label}
              </span>

              {/* Active indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* 底部导航 */}
      <div className="flex flex-col items-center gap-1 pt-4 border-t dark:border-gray-800">
        {bottomNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative w-12 h-12 rounded-xl flex items-center justify-center',
                'transition-all duration-200 group',
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300'
              )}
              title={item.label}
            >
              <Icon className="w-5 h-5" />

              {/* Tooltip */}
              <span
                className={cn(
                  'absolute left-full ml-2 px-2 py-1 rounded-md text-sm whitespace-nowrap',
                  'bg-gray-900 dark:bg-gray-700 text-white',
                  'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
                  'transition-all duration-200 z-50',
                  'pointer-events-none'
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
