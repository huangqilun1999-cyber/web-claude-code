'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Settings, Key, User, Bell, Shield, Save, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('profile')
  const [isSaving, setIsSaving] = useState(false)

  // Profile settings
  const [name, setName] = useState('')

  // API Key settings
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name)
    }
    // Check if user has API key
    checkApiKey()
  }, [session])

  const checkApiKey = async () => {
    try {
      const res = await fetch('/api/auth/api-key')
      const data = await res.json()
      setHasApiKey(data.hasApiKey)
    } catch (error) {
      console.error('Failed to check API key:', error)
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      // TODO: Implement profile update API
      alert('个人资料已保存')
    } catch (error) {
      alert('保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      alert('请输入API Key')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/auth/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      })

      if (!res.ok) {
        throw new Error('保存失败')
      }

      setApiKey('')
      setHasApiKey(true)
      alert('API Key 已保存')
    } catch (error) {
      alert('保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteApiKey = async () => {
    if (!confirm('确定要删除API Key吗？')) return

    try {
      const res = await fetch('/api/auth/api-key', {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('删除失败')
      }

      setHasApiKey(false)
      alert('API Key 已删除')
    } catch (error) {
      alert('删除失败')
    }
  }

  const tabs = [
    { id: 'profile', label: '个人资料', icon: User },
    { id: 'api', label: 'API 设置', icon: Key },
    { id: 'notifications', label: '通知', icon: Bell },
    { id: 'security', label: '安全', icon: Shield },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="p-4 md:p-6 border-b">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6" />
          <h1 className="text-xl md:text-2xl font-bold">设置</h1>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 侧边导航 */}
        <div className="w-48 border-r hidden md:block p-4">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                    activeTab === tab.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* 移动端标签 */}
        <div className="md:hidden border-b overflow-x-auto">
          <div className="flex p-2 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap',
                    activeTab === tab.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {activeTab === 'profile' && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">个人资料</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">邮箱</label>
                    <input
                      type="email"
                      value={session?.user?.email || ''}
                      disabled
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">昵称</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">API 设置</h2>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mb-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    API Key 将被加密存储，用于调用 Claude API。请确保使用有效的 Anthropic API Key。
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Anthropic API Key
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={hasApiKey ? '已设置，输入新Key可替换' : 'sk-ant-...'}
                          className="w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                        >
                          {showApiKey ? (
                            <EyeOff className="w-4 h-4 text-gray-500" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>
                    {hasApiKey && (
                      <p className="text-xs text-green-600 mt-1">✓ API Key 已设置</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveApiKey}
                      disabled={isSaving || !apiKey.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? '保存中...' : '保存'}
                    </button>

                    {hasApiKey && (
                      <button
                        onClick={handleDeleteApiKey}
                        className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="max-w-xl">
              <h2 className="text-lg font-semibold mb-4">通知设置</h2>
              <p className="text-gray-500">通知设置功能即将推出...</p>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-xl">
              <h2 className="text-lg font-semibold mb-4">安全设置</h2>
              <p className="text-gray-500">安全设置功能即将推出...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
