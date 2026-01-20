'use client'

import { useEffect, useCallback } from 'react'
import { usePluginStore } from '@/stores/plugin-store'
import { PluginList } from '@/components/plugins/plugin-list'
import { PluginSearch } from '@/components/plugins/plugin-search'
import { Puzzle } from 'lucide-react'

export default function PluginsPage() {
  const {
    plugins,
    searchQuery,
    isLoading,
    setPlugins,
    setLoading,
    setError,
  } = usePluginStore()

  const loadPlugins = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) {
        params.set('search', searchQuery)
      }

      const res = await fetch(`/api/plugins?${params}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error)
      }

      setPlugins(data.plugins)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, setPlugins, setLoading, setError])

  useEffect(() => {
    loadPlugins()
  }, [loadPlugins])

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="p-4 md:p-6 border-b">
        <div className="flex items-center gap-3 mb-4">
          <Puzzle className="w-6 h-6" />
          <h1 className="text-xl md:text-2xl font-bold">插件市场</h1>
        </div>

        <PluginSearch />
      </div>

      {/* 插件列表 */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : plugins.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            没有找到插件
          </div>
        ) : (
          <PluginList plugins={plugins} />
        )}
      </div>
    </div>
  )
}
