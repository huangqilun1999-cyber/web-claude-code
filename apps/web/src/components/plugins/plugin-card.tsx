'use client'

import { useCallback } from 'react'
import { Plugin, usePluginStore } from '@/stores/plugin-store'
import { Download, Star, CheckCircle, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PluginCardProps {
  plugin: Plugin
}

export function PluginCard({ plugin }: PluginCardProps) {
  const { installPlugin, uninstallPlugin } = usePluginStore()

  const handleInstall = useCallback(async () => {
    try {
      const res = await fetch(`/api/plugins/${plugin.id}/install`, {
        method: 'POST',
      })

      if (!res.ok) {
        throw new Error('安装失败')
      }

      installPlugin(plugin.id)
    } catch (error) {
      console.error('Install error:', error)
      alert('安装失败')
    }
  }, [plugin.id, installPlugin])

  const handleUninstall = useCallback(async () => {
    if (!confirm('确定要卸载此插件吗？')) return

    try {
      const res = await fetch(`/api/plugins/${plugin.id}/install`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('卸载失败')
      }

      uninstallPlugin(plugin.id)
    } catch (error) {
      console.error('Uninstall error:', error)
      alert('卸载失败')
    }
  }, [plugin.id, uninstallPlugin])

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800">
      {/* 头部 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
            {plugin.icon || plugin.displayName[0]}
          </div>
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              {plugin.displayName}
              {plugin.isOfficial && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </h3>
            <p className="text-xs text-gray-500">v{plugin.version}</p>
          </div>
        </div>
      </div>

      {/* 描述 */}
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
        {plugin.description || '暂无描述'}
      </p>

      {/* 统计 */}
      <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Download className="w-4 h-4" />
          {plugin.downloads}
        </span>
        <span className="flex items-center gap-1">
          <Star className="w-4 h-4" />
          {plugin.rating.toFixed(1)}
        </span>
        <span>{plugin.author}</span>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        {plugin.isInstalled ? (
          <button
            onClick={handleUninstall}
            className="flex-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
          >
            卸载
          </button>
        ) : (
          <button
            onClick={handleInstall}
            className="flex-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            安装
          </button>
        )}

        {plugin.homepage && (
          <a
            href={plugin.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  )
}
