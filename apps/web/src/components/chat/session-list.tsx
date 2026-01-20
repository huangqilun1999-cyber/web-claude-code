'use client'

import { useCallback, useState, useMemo } from 'react'
import { useSessionStore } from '@/stores/session-store'
import { useProjectStore, Project } from '@/stores/project-store'
import { useAgentStore } from '@/stores/agent-store'
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  MoreHorizontal,
  Settings,
} from 'lucide-react'
import { cn, formatRelativeTime, truncate, generateId } from '@/lib/utils'
import { CreateSessionModal } from './create-session-modal'
import { CreateProjectModal } from './create-project-modal'

interface SessionListProps {
  onSessionSelect?: () => void
}

export function SessionList({ onSessionSelect }: SessionListProps = {}) {
  const {
    sessions,
    currentSessionId,
    setCurrentSession,
    addSession,
    deleteSession,
    updateSession,
  } = useSessionStore()

  const {
    projects,
    currentProjectId,
    addProject,
    updateProject,
    deleteProject,
    toggleProjectExpanded,
  } = useProjectStore()

  const { selectedAgentId } = useAgentStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [createSessionForProject, setCreateSessionForProject] = useState<string | null>(null)
  const [projectMenuId, setProjectMenuId] = useState<string | null>(null)

  // 按项目分组会话
  const groupedData = useMemo(() => {
    const projectSessions: Record<string, typeof sessions> = {}
    const orphanSessions: typeof sessions = []

    // 初始化项目会话数组
    projects.forEach((p) => {
      projectSessions[p.id] = []
    })

    // 分组会话
    sessions.forEach((session) => {
      if (session.projectId && projectSessions[session.projectId]) {
        projectSessions[session.projectId].push(session)
      } else {
        orphanSessions.push(session)
      }
    })

    return { projectSessions, orphanSessions }
  }, [sessions, projects])

  // 过滤搜索结果
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [projects, searchQuery])

  const filteredOrphanSessions = useMemo(() => {
    if (!searchQuery) return groupedData.orphanSessions
    return groupedData.orphanSessions.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.messages.some((m) =>
          m.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
    )
  }, [groupedData.orphanSessions, searchQuery])

  const getFilteredProjectSessions = useCallback(
    (projectId: string) => {
      const projectSessionList = groupedData.projectSessions[projectId] || []
      if (!searchQuery) return projectSessionList
      return projectSessionList.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.messages.some((m) =>
            m.content.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    },
    [groupedData.projectSessions, searchQuery]
  )

  // 新建项目
  const handleCreateProject = useCallback(
    (name: string, description: string, workingDirectory: string) => {
      const newProject: Project = {
        id: `project-${generateId()}`,
        name,
        description: description || undefined,
        workingDirectory,
        agentId: selectedAgentId || undefined,
        isExpanded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      addProject(newProject)
      setShowProjectModal(false)
      setEditingProject(null)
    },
    [selectedAgentId, addProject]
  )

  // 编辑项目
  const handleEditProject = useCallback(
    (name: string, description: string, workingDirectory: string) => {
      if (!editingProject) return
      updateProject(editingProject.id, { name, description, workingDirectory })
      setShowProjectModal(false)
      setEditingProject(null)
    },
    [editingProject, updateProject]
  )

  // 删除项目
  const handleDeleteProject = useCallback(
    (projectId: string) => {
      if (confirm('确定要删除这个项目吗？项目下的会话不会被删除。')) {
        // 将项目下的会话设为无项目
        sessions
          .filter((s) => s.projectId === projectId)
          .forEach((s) => {
            updateSession(s.id, { projectId: undefined })
          })
        deleteProject(projectId)
      }
      setProjectMenuId(null)
    },
    [sessions, updateSession, deleteProject]
  )

  // 在项目下新建会话
  const handleCreateSessionInProject = useCallback(
    (name: string, workingDirectory: string) => {
      if (!selectedAgentId || !createSessionForProject) return

      const project = projects.find((p) => p.id === createSessionForProject)

      const newSession = {
        id: `session-${generateId()}`,
        name: name || `新会话 ${sessions.length + 1}`,
        projectId: createSessionForProject,
        agentId: selectedAgentId,
        workingDirectory: workingDirectory || project?.workingDirectory || undefined,
        permissionMode: 'bypassPermissions' as const,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      addSession(newSession)
      setShowCreateModal(false)
      setCreateSessionForProject(null)
    },
    [selectedAgentId, createSessionForProject, projects, sessions.length, addSession]
  )

  // 新建独立会话
  const handleCreateSession = useCallback(
    (name: string, workingDirectory: string) => {
      if (!selectedAgentId) return

      const newSession = {
        id: `session-${generateId()}`,
        name: name || `新会话 ${sessions.length + 1}`,
        agentId: selectedAgentId,
        workingDirectory: workingDirectory || undefined,
        permissionMode: 'bypassPermissions' as const,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      addSession(newSession)
      setShowCreateModal(false)
    },
    [selectedAgentId, sessions.length, addSession]
  )

  const handleDeleteSession = useCallback(
    (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation()
      if (confirm('确定要删除这个会话吗？删除后无法恢复。')) {
        deleteSession(sessionId)
      }
    },
    [deleteSession]
  )

  const handleStartEdit = useCallback(
    (e: React.MouseEvent, session: { id: string; name: string }) => {
      e.stopPropagation()
      setEditingId(session.id)
      setEditingName(session.name)
    },
    []
  )

  const handleSaveEdit = useCallback(
    (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation()
      if (editingName.trim()) {
        updateSession(sessionId, { name: editingName.trim() })
      }
      setEditingId(null)
      setEditingName('')
    },
    [editingName, updateSession]
  )

  const handleCancelEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(null)
    setEditingName('')
  }, [])

  const getSessionPreview = (session: typeof sessions[0]) => {
    const lastMessage = session.messages[session.messages.length - 1]
    if (!lastMessage) return '暂无消息'
    return truncate(lastMessage.content, 50)
  }

  // 渲染会话项
  const renderSessionItem = (session: typeof sessions[0], inProject = false) => (
    <div
      key={session.id}
      onClick={() => {
        setCurrentSession(session.id)
        onSessionSelect?.()
      }}
      className={cn(
        'group relative flex items-start gap-3 p-3 rounded-lg cursor-pointer',
        'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
        inProject && 'ml-4',
        currentSessionId === session.id &&
          'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/30'
      )}
    >
      <MessageSquare
        className={cn(
          'w-5 h-5 mt-0.5 flex-shrink-0',
          currentSessionId === session.id ? 'text-blue-500' : 'text-gray-400'
        )}
      />

      <div className="flex-1 min-w-0">
        {editingId === session.id ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveEdit(e as any, session.id)
                } else if (e.key === 'Escape') {
                  handleCancelEdit(e as any)
                }
              }}
              className="flex-1 px-2 py-0.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={(e) => handleSaveEdit(e, session.id)}
              className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30"
            >
              <Check className="w-4 h-4 text-green-500" />
            </button>
            <button
              onClick={handleCancelEdit}
              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        ) : (
          <>
            <div className="font-medium text-sm truncate pr-16">{session.name}</div>
            <div className="text-xs text-gray-500 truncate">
              {getSessionPreview(session)}
            </div>
            {!inProject && session.workingDirectory && (
              <div className="text-xs text-blue-500 truncate flex items-center gap-1 mt-0.5">
                <FolderOpen className="w-3 h-3" />
                {session.workingDirectory}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-1">
              {formatRelativeTime(session.updatedAt)} · {session.messages.length} 条消息
            </div>
          </>
        )}
      </div>

      {/* 操作按钮 */}
      {editingId !== session.id && (
        <div className="absolute right-2 top-2 flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => handleStartEdit(e, session)}
            className={cn(
              'p-2 md:p-1.5 rounded touch-manipulation',
              'hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
            )}
            title="重命名"
          >
            <Edit2 className="w-4 h-4 md:w-3.5 md:h-3.5 text-gray-500" />
          </button>
          <button
            onClick={(e) => handleDeleteSession(e, session.id)}
            className={cn(
              'p-2 md:p-1.5 rounded touch-manipulation',
              'hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors'
            )}
            title="删除"
          >
            <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5 text-red-500" />
          </button>
        </div>
      )}
    </div>
  )

  // 渲染项目
  const renderProject = (project: Project) => {
    const projectSessions = getFilteredProjectSessions(project.id)
    const hasMatchingSessions = searchQuery ? projectSessions.length > 0 : true

    // 搜索时如果项目名匹配或有匹配的会话，则显示
    if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase()) && !hasMatchingSessions) {
      return null
    }

    return (
      <div key={project.id} className="mb-2">
        {/* 项目头部 */}
        <div
          className={cn(
            'group flex items-center gap-2 p-2 rounded-lg cursor-pointer',
            'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
            currentProjectId === project.id && 'bg-gray-100 dark:bg-gray-800'
          )}
          onClick={() => toggleProjectExpanded(project.id)}
        >
          {project.isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
          <FolderOpen className="w-4 h-4 text-amber-500" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{project.name}</div>
            <div className="text-xs text-gray-500 truncate">{project.workingDirectory}</div>
          </div>
          <span className="text-xs text-gray-400">
            {groupedData.projectSessions[project.id]?.length || 0}
          </span>

          {/* 项目菜单 */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setProjectMenuId(projectMenuId === project.id ? null : project.id)
              }}
              className={cn(
                'p-1.5 rounded md:opacity-0 md:group-hover:opacity-100',
                'hover:bg-gray-200 dark:hover:bg-gray-700 transition-all'
              )}
            >
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>

            {projectMenuId === project.id && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setProjectMenuId(null)}
                />
                <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border py-1 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setCreateSessionForProject(project.id)
                      setShowCreateModal(true)
                      setProjectMenuId(null)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Plus className="w-4 h-4" />
                    新建会话
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingProject(project)
                      setShowProjectModal(true)
                      setProjectMenuId(null)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Settings className="w-4 h-4" />
                    编辑项目
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteProject(project.id)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除项目
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 项目会话列表 */}
        {project.isExpanded && (
          <div className="mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 ml-3">
            {projectSessions.length === 0 ? (
              <div className="ml-4 py-2 text-xs text-gray-400">
                暂无会话
                <button
                  onClick={() => {
                    setCreateSessionForProject(project.id)
                    setShowCreateModal(true)
                  }}
                  className="ml-2 text-blue-500 hover:underline"
                >
                  新建
                </button>
              </div>
            ) : (
              projectSessions.map((session) => renderSessionItem(session, true))
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="h-full flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b space-y-3">
          {/* 按钮组 */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!selectedAgentId) {
                  alert('请先选择一个Agent')
                  return
                }
                setShowProjectModal(true)
              }}
              disabled={!selectedAgentId}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg',
                'bg-amber-500 text-white hover:bg-amber-600 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <FolderPlus className="w-4 h-4" />
              <span>新建项目</span>
            </button>
            <button
              onClick={() => {
                if (!selectedAgentId) {
                  alert('请先选择一个Agent')
                  return
                }
                setCreateSessionForProject(null)
                setShowCreateModal(true)
              }}
              disabled={!selectedAgentId}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg',
                'bg-blue-500 text-white hover:bg-blue-600 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Plus className="w-4 h-4" />
              <span>新会话</span>
            </button>
          </div>

          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索项目或会话..."
              className={cn(
                'w-full pl-9 pr-4 py-2 rounded-lg border text-sm',
                'bg-white dark:bg-gray-800',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
            />
          </div>
        </div>

        {/* 列表内容 */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* 项目列表 */}
          {filteredProjects.length > 0 && (
            <div className="mb-4">
              {filteredProjects.map(renderProject)}
            </div>
          )}

          {/* 独立会话 */}
          {filteredOrphanSessions.length > 0 && (
            <div>
              {projects.length > 0 && (
                <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  未分类会话
                </div>
              )}
              <div className="space-y-1">
                {filteredOrphanSessions.map((session) => renderSessionItem(session))}
              </div>
            </div>
          )}

          {/* 空状态 */}
          {filteredProjects.length === 0 && filteredOrphanSessions.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              {searchQuery ? '没有找到匹配的项目或会话' : '暂无项目或会话'}
            </div>
          )}
        </div>

        {/* 底部统计 */}
        <div className="p-3 border-t text-xs text-gray-400 text-center">
          {projects.length} 个项目 · {sessions.length} 个会话
        </div>
      </div>

      {/* 创建会话弹窗 */}
      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setCreateSessionForProject(null)
        }}
        onConfirm={createSessionForProject ? handleCreateSessionInProject : handleCreateSession}
        defaultWorkingDirectory={
          createSessionForProject
            ? projects.find((p) => p.id === createSessionForProject)?.workingDirectory
            : undefined
        }
        hideWorkingDirectory={!!createSessionForProject}
      />

      {/* 创建/编辑项目弹窗 */}
      <CreateProjectModal
        isOpen={showProjectModal}
        onClose={() => {
          setShowProjectModal(false)
          setEditingProject(null)
        }}
        onConfirm={editingProject ? handleEditProject : handleCreateProject}
        editProject={editingProject}
      />
    </>
  )
}
