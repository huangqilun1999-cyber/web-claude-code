'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageSquare,
  FolderTree,
  Terminal,
  Bot,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/workspace', icon: MessageSquare, label: '对话' },
  { href: '/workspace?tab=files', icon: FolderTree, label: '文件' },
  { href: '/workspace?tab=terminal', icon: Terminal, label: '终端' },
  { href: '/agents', icon: Bot, label: 'Agent' },
  { href: '/settings', icon: Settings, label: '设置' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t md:hidden safe-area-bottom">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href.split('?')[0])

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center py-2 px-4',
                'transition-colors',
                isActive ? 'text-blue-600' : 'text-gray-500'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
