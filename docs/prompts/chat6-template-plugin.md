# Chat 6 提示词：模板 + 插件 + 移动端适配

## 任务说明
你正在参与开发 "Web Claude Code" 平台。**你的职责**：项目模板系统、插件系统、移动端响应式适配。

## 工作目录
```
d:\github\Web-Claude code
```

## 技术栈
- React + TypeScript
- Tailwind CSS (响应式)
- Zustand (状态管理)
- React Hook Form (表单)

---

## 详细任务清单

### 阶段1：项目模板数据库和API

1. **创建模板API apps/web/src/app/api/templates/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/db'
import { authOptions } from '@/lib/auth'

// 获取模板列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const where: any = { isPublic: true }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: [{ isOfficial: 'desc' }, { downloads: 'desc' }],
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Get templates error:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

// 创建模板
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, category, config } = body

    const template = await prisma.template.create({
      data: {
        name,
        description,
        category,
        config,
        authorId: session.user.id,
        author: session.user.name || session.user.email,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
```

2. **创建单个模板API apps/web/src/app/api/templates/[id]/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.template.findUnique({
      where: { id: params.id },
    })

    if (!template) {
      return NextResponse.json({ error: '模板不存在' }, { status: 404 })
    }

    // 增加下载次数
    await prisma.template.update({
      where: { id: params.id },
      data: { downloads: { increment: 1 } },
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Get template error:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}
```

---

### 阶段2：模板状态管理

1. **创建 apps/web/src/stores/template-store.ts**
```typescript
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
```

---

### 阶段3：模板页面组件

1. **创建 apps/web/src/app/(dashboard)/templates/page.tsx**
```typescript
'use client'

import { useEffect, useCallback } from 'react'
import { useTemplateStore, Template } from '@/stores/template-store'
import { TemplateList } from '@/components/templates/template-list'
import { TemplateSearch } from '@/components/templates/template-search'
import { TemplateCategories } from '@/components/templates/template-categories'
import { CreateProjectDialog } from '@/components/templates/create-project-dialog'
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
```

2. **创建 apps/web/src/components/templates/template-list.tsx**
```typescript
'use client'

import { useState } from 'react'
import { Template } from '@/stores/template-store'
import { TemplateCard } from './template-card'
import { CreateProjectDialog } from './create-project-dialog'

interface TemplateListProps {
  templates: Template[]
}

export function TemplateList({ templates }: TemplateListProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={() => setSelectedTemplate(template)}
          />
        ))}
      </div>

      <CreateProjectDialog
        template={selectedTemplate}
        open={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
      />
    </>
  )
}
```

3. **创建 apps/web/src/components/templates/template-card.tsx**
```typescript
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
```

4. **创建 apps/web/src/components/templates/create-project-dialog.tsx**
```typescript
'use client'

import { useState, useCallback } from 'react'
import { Template, TemplateVariable } from '@/stores/template-store'
import { useWS } from '@/lib/websocket'
import { useAgentStore } from '@/stores/agent-store'
import { useFileStore } from '@/stores/file-store'
import { X, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreateProjectDialogProps {
  template: Template | null
  open: boolean
  onClose: () => void
}

export function CreateProjectDialog({
  template,
  open,
  onClose,
}: CreateProjectDialogProps) {
  const { send, isConnected } = useWS()
  const { selectedAgentId } = useAgentStore()
  const { rootPath } = useFileStore()

  const [projectName, setProjectName] = useState('')
  const [targetPath, setTargetPath] = useState(rootPath || '')
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = useCallback(async () => {
    if (!template || !projectName || !targetPath) return
    if (!selectedAgentId || !isConnected) {
      alert('请先连接Agent')
      return
    }

    setIsCreating(true)

    try {
      const fullPath = `${targetPath}/${projectName}`

      // 创建项目目录
      send('client:file', {
        agentId: selectedAgentId,
        action: 'mkdir',
        path: fullPath,
      })

      // 创建模板文件
      for (const file of template.config.files) {
        let content = file.content

        // 替换变量
        if (file.isTemplate) {
          content = content.replace(/\{\{(\w+)\}\}/g, (_, key) => {
            return variables[key] || `{{${key}}}`
          })
          content = content.replace(/\{\{projectName\}\}/g, projectName)
        }

        send('client:file', {
          agentId: selectedAgentId,
          action: 'write',
          path: `${fullPath}/${file.path}`,
          content,
        })
      }

      alert('项目创建成功！')
      onClose()
    } catch (error) {
      console.error('Failed to create project:', error)
      alert('创建失败，请重试')
    } finally {
      setIsCreating(false)
    }
  }, [
    template,
    projectName,
    targetPath,
    variables,
    selectedAgentId,
    isConnected,
    send,
    onClose,
  ])

  if (!open || !template) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">使用模板创建项目</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4 space-y-4">
          {/* 模板信息 */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="w-10 h-10 rounded bg-blue-500 flex items-center justify-center text-white">
              {template.icon || template.name[0]}
            </div>
            <div>
              <div className="font-medium">{template.name}</div>
              <div className="text-sm text-gray-500">{template.category}</div>
            </div>
          </div>

          {/* 项目名称 */}
          <div>
            <label className="block text-sm font-medium mb-1">项目名称 *</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="my-project"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 目标路径 */}
          <div>
            <label className="block text-sm font-medium mb-1">创建位置 *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={targetPath}
                onChange={(e) => setTargetPath(e.target.value)}
                placeholder="/home/user/projects"
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-3 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <Folder className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 模板变量 */}
          {template.config.variables?.map((variable) => (
            <div key={variable.name}>
              <label className="block text-sm font-medium mb-1">
                {variable.label}
                {variable.required && ' *'}
              </label>
              {variable.type === 'select' ? (
                <select
                  value={variables[variable.name] || variable.default || ''}
                  onChange={(e) =>
                    setVariables({ ...variables, [variable.name]: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {variable.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : variable.type === 'boolean' ? (
                <input
                  type="checkbox"
                  checked={variables[variable.name] === 'true'}
                  onChange={(e) =>
                    setVariables({
                      ...variables,
                      [variable.name]: e.target.checked.toString(),
                    })
                  }
                  className="w-5 h-5"
                />
              ) : (
                <input
                  type="text"
                  value={variables[variable.name] || variable.default || ''}
                  onChange={(e) =>
                    setVariables({ ...variables, [variable.name]: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              )}
            </div>
          ))}
        </div>

        {/* 底部 */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={!projectName || !targetPath || isCreating}
            className={cn(
              'px-4 py-2 bg-blue-500 text-white rounded-lg',
              'hover:bg-blue-600 disabled:opacity-50'
            )}
          >
            {isCreating ? '创建中...' : '创建项目'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

5. **创建 apps/web/src/components/templates/template-search.tsx**
```typescript
'use client'

import { useTemplateStore } from '@/stores/template-store'
import { Search } from 'lucide-react'
import { useCallback, useState, useEffect } from 'react'

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
        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}
```

6. **创建 apps/web/src/components/templates/template-categories.tsx**
```typescript
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
```

---

### 阶段4：插件系统

1. **创建插件API apps/web/src/app/api/plugins/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/db'
import { authOptions } from '@/lib/auth'

// 获取插件列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const where: any = { isActive: true }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const plugins = await prisma.plugin.findMany({
      where,
      orderBy: [{ isOfficial: 'desc' }, { downloads: 'desc' }],
    })

    // 如果用户已登录，获取已安装的插件
    let installedPluginIds: string[] = []
    if (session?.user?.id) {
      const userPlugins = await prisma.userPlugin.findMany({
        where: { userId: session.user.id },
        select: { pluginId: true },
      })
      installedPluginIds = userPlugins.map((up) => up.pluginId)
    }

    const pluginsWithInstallStatus = plugins.map((plugin) => ({
      ...plugin,
      isInstalled: installedPluginIds.includes(plugin.id),
    }))

    return NextResponse.json({ plugins: pluginsWithInstallStatus })
  } catch (error) {
    console.error('Get plugins error:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}
```

2. **创建 apps/web/src/stores/plugin-store.ts**
```typescript
import { create } from 'zustand'

export interface Plugin {
  id: string
  name: string
  displayName: string
  description?: string
  version: string
  author: string
  icon?: string
  homepage?: string
  repository?: string
  isOfficial: boolean
  downloads: number
  rating: number
  permissions: string[]
  isInstalled?: boolean
  isEnabled?: boolean
}

interface PluginState {
  plugins: Plugin[]
  installedPlugins: Plugin[]
  searchQuery: string
  isLoading: boolean
  error: string | null

  // Actions
  setPlugins: (plugins: Plugin[]) => void
  setInstalledPlugins: (plugins: Plugin[]) => void
  setSearchQuery: (query: string) => void
  installPlugin: (pluginId: string) => void
  uninstallPlugin: (pluginId: string) => void
  togglePlugin: (pluginId: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const usePluginStore = create<PluginState>((set) => ({
  plugins: [],
  installedPlugins: [],
  searchQuery: '',
  isLoading: false,
  error: null,

  setPlugins: (plugins) => set({ plugins }),
  setInstalledPlugins: (plugins) => set({ installedPlugins: plugins }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  installPlugin: (pluginId) =>
    set((state) => {
      const plugin = state.plugins.find((p) => p.id === pluginId)
      if (!plugin) return state

      return {
        plugins: state.plugins.map((p) =>
          p.id === pluginId ? { ...p, isInstalled: true } : p
        ),
        installedPlugins: [...state.installedPlugins, { ...plugin, isInstalled: true, isEnabled: true }],
      }
    }),

  uninstallPlugin: (pluginId) =>
    set((state) => ({
      plugins: state.plugins.map((p) =>
        p.id === pluginId ? { ...p, isInstalled: false } : p
      ),
      installedPlugins: state.installedPlugins.filter((p) => p.id !== pluginId),
    })),

  togglePlugin: (pluginId) =>
    set((state) => ({
      installedPlugins: state.installedPlugins.map((p) =>
        p.id === pluginId ? { ...p, isEnabled: !p.isEnabled } : p
      ),
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}))
```

3. **创建 apps/web/src/app/(dashboard)/plugins/page.tsx**
```typescript
'use client'

import { useEffect, useCallback } from 'react'
import { usePluginStore } from '@/stores/plugin-store'
import { PluginList } from '@/components/plugins/plugin-list'
import { Search, Puzzle } from 'lucide-react'

export default function PluginsPage() {
  const {
    plugins,
    searchQuery,
    isLoading,
    setPlugins,
    setSearchQuery,
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

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索插件..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
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
```

4. **创建 apps/web/src/components/plugins/plugin-list.tsx**
```typescript
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
```

5. **创建 apps/web/src/components/plugins/plugin-card.tsx**
```typescript
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
            className="flex-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
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
            className="p-1.5 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  )
}
```

---

### 阶段5：移动端响应式适配

1. **创建 apps/web/src/hooks/use-mobile.ts**
```typescript
'use client'

import { useState, useEffect } from 'react'

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)

    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}
```

2. **创建 apps/web/src/components/layout/mobile-nav.tsx**
```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  MessageSquare,
  Bot,
  History,
  LayoutTemplate,
  Puzzle,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/workspace', icon: MessageSquare, label: '工作区' },
  { href: '/agents', icon: Bot, label: 'Agent' },
  { href: '/history', icon: History, label: '历史' },
  { href: '/templates', icon: LayoutTemplate, label: '模板' },
  { href: '/plugins', icon: Puzzle, label: '插件' },
  { href: '/settings', icon: Settings, label: '设置' },
]

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* 汉堡菜单按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 md:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* 抽屉 */}
      {isOpen && (
        <>
          {/* 遮罩 */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* 侧边栏 */}
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">Web Claude Code</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="p-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg',
                      'transition-colors',
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
```

3. **创建 apps/web/src/components/layout/bottom-nav.tsx** (移动端底部导航)
```typescript
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
```

4. **更新全局样式 apps/web/src/app/globals.css** 添加安全区域支持
```css
/* 在现有样式后添加 */

/* 安全区域支持（iPhone刘海等） */
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

.safe-area-left {
  padding-left: env(safe-area-inset-left);
}

.safe-area-right {
  padding-right: env(safe-area-inset-right);
}

/* 移动端触摸优化 */
@media (pointer: coarse) {
  button,
  a,
  [role="button"] {
    min-height: 44px;
    min-width: 44px;
  }
}

/* 禁用iOS双击缩放 */
* {
  touch-action: manipulation;
}

/* 滚动条优化 */
.scrollbar-thin {
  scrollbar-width: thin;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(155, 155, 155, 0.5);
  border-radius: 3px;
}
```

5. **更新Dashboard布局 apps/web/src/app/(dashboard)/layout.tsx**
```typescript
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { WebSocketProvider } from '@/lib/websocket'
import { DashboardHeader } from '@/components/layout/header'
import { DashboardSidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <WebSocketProvider>
      <div className="h-screen flex flex-col">
        <DashboardHeader />
        <div className="flex-1 flex overflow-hidden">
          {/* 桌面端侧边栏 */}
          <div className="hidden md:block">
            <DashboardSidebar />
          </div>
          {/* 主内容 */}
          <main className="flex-1 overflow-hidden pb-16 md:pb-0">
            {children}
          </main>
        </div>
        {/* 移动端底部导航 */}
        <BottomNav />
      </div>
    </WebSocketProvider>
  )
}
```

---

## 输出要求

1. 模板系统完整可用
2. 插件系统基本框架完成
3. 移动端适配良好
4. 触摸操作友好

## 完成标志

- [ ] 模板API完成
- [ ] 模板页面完成
- [ ] 创建项目功能完成
- [ ] 插件系统基本完成
- [ ] 移动端导航完成
- [ ] 响应式布局完成

## 注意事项

1. 模板文件需要正确转义
2. 插件权限需要验证
3. 移动端需要测试触摸
4. 安全区域需要适配
