'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { History, MessageSquare, Trash2, Search } from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'

interface SessionItem {
  id: string
  name: string
  workingDirectory?: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

export default function HistoryPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const loadSessions = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) {
        params.set('search', searchQuery)
      }

      const res = await fetch(`/api/sessions?${params}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error)
      }

      setSessions(data.sessions)
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSessions()
    }, 300)

    return () => clearTimeout(timer)
  }, [loadSessions])

  const handleOpenSession = (sessionId: string) => {
    router.push(`/workspace?session=${sessionId}`)
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('确定要删除这个会话吗？')) return

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('删除失败')
      }

      loadSessions()
    } catch (error) {
      alert('删除失败')
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="p-4 md:p-6 border-b">
        <div className="flex items-center gap-3 mb-4">
          <History className="w-6 h-6" />
          <h1 className="text-xl md:text-2xl font-bold">会话历史</h1>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索会话..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
          />
        </div>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">没有会话记录</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  'flex items-center justify-between p-4 border rounded-lg',
                  'bg-white dark:bg-gray-800 hover:border-blue-500 transition-colors',
                  'cursor-pointer'
                )}
                onClick={() => handleOpenSession(session.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium truncate">{session.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{session.messageCount} 条消息</span>
                      <span>•</span>
                      <span>{formatRelativeTime(session.updatedAt)}</span>
                    </div>
                    {session.workingDirectory && (
                      <p className="text-xs text-gray-400 font-mono truncate mt-1">
                        {session.workingDirectory}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteSession(session.id)
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
