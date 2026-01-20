import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Project {
  id: string
  name: string
  description?: string
  workingDirectory: string
  agentId?: string
  isExpanded: boolean
  createdAt: Date
  updatedAt: Date
}

interface ProjectState {
  projects: Project[]
  currentProjectId: string | null

  // Actions
  addProject: (project: Project) => void
  updateProject: (projectId: string, updates: Partial<Project>) => void
  deleteProject: (projectId: string) => void
  setCurrentProject: (projectId: string | null) => void
  toggleProjectExpanded: (projectId: string) => void
  clearProjects: () => void
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,

      addProject: (project) =>
        set((state) => ({
          projects: [project, ...state.projects],
          currentProjectId: project.id,
        })),

      updateProject: (projectId, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, ...updates, updatedAt: new Date() }
              : p
          ),
        })),

      deleteProject: (projectId) =>
        set((state) => {
          const filteredProjects = state.projects.filter((p) => p.id !== projectId)
          return {
            projects: filteredProjects,
            currentProjectId:
              state.currentProjectId === projectId
                ? filteredProjects[0]?.id || null
                : state.currentProjectId,
          }
        }),

      setCurrentProject: (projectId) =>
        set({ currentProjectId: projectId }),

      toggleProjectExpanded: (projectId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, isExpanded: !p.isExpanded }
              : p
          ),
        })),

      clearProjects: () =>
        set({
          projects: [],
          currentProjectId: null,
        }),
    }),
    {
      name: 'project-storage',
      partialize: (state) => ({
        projects: state.projects,
        currentProjectId: state.currentProjectId,
      }),
    }
  )
)

// Selector hooks
export const useCurrentProject = () => {
  const { projects, currentProjectId } = useProjectStore()
  return projects.find((p) => p.id === currentProjectId)
}

export const useProjectById = (projectId: string | null) => {
  const { projects } = useProjectStore()
  if (!projectId) return null
  return projects.find((p) => p.id === projectId)
}
