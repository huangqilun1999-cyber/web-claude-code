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
  const wsContext = useWS()
  const send = wsContext?.send
  const isConnected = wsContext?.isConnected ?? false
  const { selectedAgentId } = useAgentStore()
  const { rootPath } = useFileStore()

  const [projectName, setProjectName] = useState('')
  const [targetPath, setTargetPath] = useState(rootPath || '')
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = useCallback(async () => {
    if (!template || !projectName || !targetPath) return
    if (!selectedAgentId || !isConnected || !send) {
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
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
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
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <button className="px-3 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600">
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
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
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
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              )}
            </div>
          ))}
        </div>

        {/* 底部 */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
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
