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
