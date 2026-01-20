import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Agent {
  id: string
  name: string
  description?: string
  type: 'LOCAL' | 'SERVER'
  secretKey?: string  // 可选，出于安全考虑可能不返回
  isOnline: boolean
  lastSeenAt?: string
  currentDirectory?: string
  systemInfo?: Record<string, any>
}

interface AgentState {
  agents: Agent[]
  selectedAgentId: string | null
  isLoading: boolean
  error: string | null

  // Actions
  setAgents: (agents: Agent[]) => void
  setSelectedAgent: (agentId: string | null) => void
  updateAgentStatus: (agentId: string, isOnline: boolean, systemInfo?: Record<string, any>) => void
  addAgent: (agent: Agent) => void
  removeAgent: (agentId: string) => void
  updateAgent: (agentId: string, updates: Partial<Agent>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set) => ({
      agents: [],
      selectedAgentId: null,
      isLoading: false,
      error: null,

      setAgents: (agents) => set({ agents }),

      setSelectedAgent: (agentId) => set({ selectedAgentId: agentId }),

      updateAgentStatus: (agentId, isOnline, systemInfo) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId
              ? {
                  ...a,
                  isOnline,
                  lastSeenAt: isOnline ? new Date().toISOString() : a.lastSeenAt,
                  systemInfo: systemInfo || a.systemInfo,
                }
              : a
          ),
        })),

      addAgent: (agent) =>
        set((state) => {
          // 防止重复添加
          const exists = state.agents.some((a) => a.id === agent.id)
          if (exists) {
            return {
              agents: state.agents.map((a) =>
                a.id === agent.id ? { ...a, ...agent } : a
              ),
            }
          }
          return {
            agents: [...state.agents, agent],
          }
        }),

      removeAgent: (agentId) =>
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== agentId),
          selectedAgentId:
            state.selectedAgentId === agentId ? null : state.selectedAgentId,
        })),

      updateAgent: (agentId, updates) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId ? { ...a, ...updates } : a
          ),
        })),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),
    }),
    {
      name: 'agent-storage',
      partialize: (state) => ({
        selectedAgentId: state.selectedAgentId,
      }),
    }
  )
)

// Selector hooks
export const useSelectedAgent = () => {
  const { agents, selectedAgentId } = useAgentStore()
  return agents.find((a) => a.id === selectedAgentId)
}

export const useOnlineAgents = () => {
  const { agents } = useAgentStore()
  return agents.filter((a) => a.isOnline)
}

export const useAgentById = (agentId: string | null) => {
  const { agents } = useAgentStore()
  if (!agentId) return null
  return agents.find((a) => a.id === agentId)
}
