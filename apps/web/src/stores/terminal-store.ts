import { create } from 'zustand'

export interface TerminalInstance {
  id: string
  name: string
  isActive: boolean
  workingDirectory: string
}

interface TerminalState {
  terminals: TerminalInstance[]
  activeTerminalId: string | null

  // Actions
  addTerminal: (terminal: TerminalInstance) => void
  removeTerminal: (id: string) => void
  setActiveTerminal: (id: string) => void
  updateTerminal: (id: string, updates: Partial<TerminalInstance>) => void
  renameTerminal: (id: string, name: string) => void
}

export const useTerminalStore = create<TerminalState>((set) => ({
  terminals: [],
  activeTerminalId: null,

  addTerminal: (terminal) =>
    set((state) => ({
      terminals: [...state.terminals, terminal],
      activeTerminalId: terminal.id,
    })),

  removeTerminal: (id) =>
    set((state) => {
      const newTerminals = state.terminals.filter((t) => t.id !== id)
      let newActiveId = state.activeTerminalId

      if (state.activeTerminalId === id) {
        newActiveId = newTerminals[0]?.id || null
      }

      return {
        terminals: newTerminals,
        activeTerminalId: newActiveId,
      }
    }),

  setActiveTerminal: (id) => set({ activeTerminalId: id }),

  updateTerminal: (id, updates) =>
    set((state) => ({
      terminals: state.terminals.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),

  renameTerminal: (id, name) =>
    set((state) => ({
      terminals: state.terminals.map((t) =>
        t.id === id ? { ...t, name } : t
      ),
    })),
}))

export const useActiveTerminal = () => {
  const { terminals, activeTerminalId } = useTerminalStore()
  return terminals.find((t) => t.id === activeTerminalId)
}
