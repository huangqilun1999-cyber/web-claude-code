'use client'

import { useTemplateStore } from '@/stores/template-store'
import { Search } from 'lucide-react'
import { useState, useEffect } from 'react'

export function TemplateSearch() {
  const { searchQuery, setSearchQuery } = useTemplateStore()
  const [localQuery, setLocalQuery] = useState(searchQuery)

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [localQuery, setSearchQuery])

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        placeholder="搜索模板..."
        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
      />
    </div>
  )
}
