import { create } from 'zustand'

export interface Template {
  id: string
  name: string
  description?: string
  category: string
  icon?: string
  author?: string
  isOfficial: boolean
  downloads: number
  stars: number
  version: string
  config: TemplateConfig
}

export interface TemplateConfig {
  files: TemplateFile[]
  variables?: TemplateVariable[]
  scripts?: {
    postCreate?: string
  }
}

export interface TemplateFile {
  path: string
  content: string
  isTemplate?: boolean
}

export interface TemplateVariable {
  name: string
  label: string
  type: 'text' | 'select' | 'boolean'
  default?: string
  options?: string[]
  required?: boolean
}

interface TemplateState {
  templates: Template[]
  categories: string[]
  selectedCategory: string | null
  searchQuery: string
  isLoading: boolean
  error: string | null

  // Actions
  setTemplates: (templates: Template[]) => void
  setCategories: (categories: string[]) => void
  setSelectedCategory: (category: string | null) => void
  setSearchQuery: (query: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useTemplateStore = create<TemplateState>((set) => ({
  templates: [],
  categories: [
    '全部',
    'Web应用',
    'API服务',
    '移动应用',
    '桌面应用',
    '工具库',
    '其他',
  ],
  selectedCategory: null,
  searchQuery: '',
  isLoading: false,
  error: null,

  setTemplates: (templates) => set({ templates }),
  setCategories: (categories) => set({ categories }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}))
