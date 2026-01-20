'use client'

import { Template } from '@/stores/template-store'
import { Star, Download, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TemplateCardProps {
  template: Template
  onSelect: () => void
}

export function TemplateCard({ template, onSelect }: TemplateCardProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'p-4 border rounded-lg cursor-pointer transition-all',
        'hover:border-blue-500 hover:shadow-md',
        'bg-white dark:bg-gray-800'
      )}
    >
      {/* 图标和官方标识 */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl">
          {template.icon || template.name[0]}
        </div>
        {template.isOfficial && (
          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" />
            官方
          </span>
        )}
      </div>

      {/* 名称和描述 */}
      <h3 className="font-semibold mb-1">{template.name}</h3>
      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
        {template.description || '暂无描述'}
      </p>

      {/* 统计信息 */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Download className="w-4 h-4" />
          {template.downloads}
        </span>
        <span className="flex items-center gap-1">
          <Star className="w-4 h-4" />
          {template.stars}
        </span>
        <span>{template.category}</span>
      </div>
    </div>
  )
}
