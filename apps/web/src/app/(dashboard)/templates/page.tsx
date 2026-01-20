'use client'

import { useEffect, useCallback } from 'react'
import { useTemplateStore, Template } from '@/stores/template-store'
import { TemplateList } from '@/components/templates/template-list'
import { TemplateSearch } from '@/components/templates/template-search'
import { TemplateCategories } from '@/components/templates/template-categories'
import { LayoutTemplate } from 'lucide-react'

export default function TemplatesPage() {
  const {
    templates,
    selectedCategory,
    searchQuery,
    isLoading,
    setTemplates,
    setLoading,
    setError,
  } = useTemplateStore()

  // 加载模板
  const loadTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory && selectedCategory !== '全部') {
        params.set('category', selectedCategory)
      }
      if (searchQuery) {
        params.set('search', searchQuery)
      }

      const res = await fetch(`/api/templates?${params}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error)
      }

      setTemplates(data.templates)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, searchQuery, setTemplates, setLoading, setError])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="p-4 md:p-6 border-b">
        <div className="flex items-center gap-3 mb-4">
          <LayoutTemplate className="w-6 h-6" />
          <h1 className="text-xl md:text-2xl font-bold">项目模板</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <TemplateSearch />
          <TemplateCategories />
        </div>
      </div>

      {/* 模板列表 */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            没有找到模板
          </div>
        ) : (
          <TemplateList templates={templates} />
        )}
      </div>
    </div>
  )
}
