'use client'

import { Plugin } from '@/stores/plugin-store'
import { PluginCard } from './plugin-card'

interface PluginListProps {
  plugins: Plugin[]
}

export function PluginList({ plugins }: PluginListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {plugins.map((plugin) => (
        <PluginCard key={plugin.id} plugin={plugin} />
      ))}
    </div>
  )
}
