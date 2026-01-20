import { create } from 'zustand'

export interface GitStatus {
  branch: string
  ahead: number
  behind: number
  staged: string[]
  unstaged: string[]
  untracked: string[]
  isClean?: boolean
}

export interface GitBranch {
  name: string
  current: boolean
  remote?: string
  commit?: string
}

export interface GitCommit {
  hash: string
  shortHash?: string
  message: string
  author: string
  date: string
}

interface GitState {
  status: GitStatus | null
  branches: GitBranch[]
  commits: GitCommit[]
  isLoading: boolean
  error: string | null

  // Actions
  setStatus: (status: GitStatus | null) => void
  setBranches: (branches: GitBranch[]) => void
  setCommits: (commits: GitCommit[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useGitStore = create<GitState>((set) => ({
  status: null,
  branches: [],
  commits: [],
  isLoading: false,
  error: null,

  setStatus: (status) => set({ status }),
  setBranches: (branches) => set({ branches }),
  setCommits: (commits) => set({ commits }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      status: null,
      branches: [],
      commits: [],
      isLoading: false,
      error: null,
    }),
}))
