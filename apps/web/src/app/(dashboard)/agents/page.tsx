'use client'

import { useEffect, useCallback, useState } from 'react'
import { useAgentStore, Agent } from '@/stores/agent-store'
import { Bot, Plus, RefreshCw, Trash2, Copy, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AgentsPage() {
  const { agents, isLoading, setAgents, setLoading, setError } = useAgentStore()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newAgentName, setNewAgentName] = useState('')
  const [newAgentDesc, setNewAgentDesc] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({})

  const loadAgents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/agents')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error)
      }

      setAgents(data.agents)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [setAgents, setLoading, setError])

  useEffect(() => {
    loadAgents()
  }, [loadAgents])

  const handleCreateAgent = async () => {
    if (!newAgentName.trim()) return

    setIsCreating(true)
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAgentName,
          description: newAgentDesc,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error)
      }

      setNewAgentName('')
      setNewAgentDesc('')
      setShowCreateForm(false)
      loadAgents()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('确定要删除这个Agent吗？')) return

    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('删除失败')
      }

      loadAgents()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleCopyKey = async (key: string) => {
    await navigator.clipboard.writeText(key)
    alert('密钥已复制到剪贴板')
  }

  const handleRegenerateKey = async (agentId: string) => {
    if (!confirm('重新生成密钥后，原密钥将失效。确定要继续吗？')) return

    try {
      const res = await fetch(`/api/agents/${agentId}/regenerate-key`, {
        method: 'POST',
      })

      if (!res.ok) {
        throw new Error('重新生成失败')
      }

      loadAgents()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const toggleKeyVisibility = (agentId: string) => {
    setVisibleKeys((prev) => ({
      ...prev,
      [agentId]: !prev[agentId],
    }))
  }

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="p-4 md:p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6" />
            <h1 className="text-xl md:text-2xl font-bold">Agent 管理</h1>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">创建 Agent</span>
          </button>
        </div>
      </div>

      {/* Agent 列表 */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-4">还没有创建任何 Agent</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              创建第一个 Agent
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="p-4 border rounded-lg bg-white dark:bg-gray-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        agent.isOnline
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-gray-100 dark:bg-gray-700'
                      )}
                    >
                      <Bot
                        className={cn(
                          'w-5 h-5',
                          agent.isOnline ? 'text-green-600' : 'text-gray-400'
                        )}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold">{agent.name}</h3>
                      <p className="text-xs text-gray-500">
                        {agent.isOnline ? '在线' : '离线'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteAgent(agent.id)}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {agent.description && (
                  <p className="text-sm text-gray-500 mb-3">{agent.description}</p>
                )}

                {/* Secret Key */}
                <div className="mb-3">
                  <label className="text-xs text-gray-500 mb-1 block">密钥</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded font-mono overflow-hidden">
                      {visibleKeys[agent.id]
                        ? agent.secretKey
                        : '••••••••••••••••'}
                    </code>
                    <button
                      onClick={() => toggleKeyVisibility(agent.id)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      {visibleKeys[agent.id] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => agent.secretKey && handleCopyKey(agent.secretKey)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      disabled={!agent.secretKey}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRegenerateKey(agent.id)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="重新生成密钥"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {agent.currentDirectory && (
                  <div className="text-xs text-gray-500">
                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {agent.currentDirectory}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 创建 Agent 对话框 */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">创建新 Agent</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">名称 *</label>
                <input
                  type="text"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="我的Agent"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">描述</label>
                <textarea
                  value={newAgentDesc}
                  onChange={(e) => setNewAgentDesc(e.target.value)}
                  placeholder="可选的描述信息"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={handleCreateAgent}
                disabled={!newAgentName.trim() || isCreating}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {isCreating ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
