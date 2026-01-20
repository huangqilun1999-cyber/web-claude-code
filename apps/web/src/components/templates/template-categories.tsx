'use client'

import { useTemplateStore } from '@/stores/template-store'
import { cn } from '@/lib/utils'

export function TemplateCategories() {
  const { categories, selectedCategory, setSelectedCategory } = useTemplateStore()

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() =>
            setSelectedCategory(category === '全部' ? null : category)
          }
          className={cn(
            'px-3 py-1.5 rounded-full text-sm transition-colors',
            (selectedCategory === category ||
              (category === '全部' && !selectedCategory))
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          {category}
        </button>
      ))}
    </div>
  )
}
