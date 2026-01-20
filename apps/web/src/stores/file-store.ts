import { create } from 'zustand'

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  modifiedAt?: string
  extension?: string
  children?: FileNode[]
  isExpanded?: boolean
  isLoading?: boolean
}

export interface OpenFile {
  path: string
  name: string
  content: string
  language: string
  isDirty: boolean
  originalContent: string
}

interface FileState {
  // 文件树
  rootPath: string
  fileTree: FileNode[]
  isLoadingTree: boolean

  // 打开的文件
  openFiles: OpenFile[]
  activeFilePath: string | null

  // Actions
  setRootPath: (path: string) => void
  setFileTree: (tree: FileNode[]) => void
  setLoadingTree: (loading: boolean) => void
  toggleFolder: (path: string) => void
  setFolderChildren: (path: string, children: FileNode[]) => void
  setFolderLoading: (path: string, loading: boolean) => void

  // File actions
  openFile: (file: OpenFile) => void
  closeFile: (path: string) => void
  setActiveFile: (path: string) => void
  updateFileContent: (path: string, content: string) => void
  markFileSaved: (path: string) => void
  closeAllFiles: () => void
}

export const useFileStore = create<FileState>((set) => ({
  rootPath: '',
  fileTree: [],
  isLoadingTree: false,
  openFiles: [],
  activeFilePath: null,

  setRootPath: (path) => set({ rootPath: path }),

  setFileTree: (tree) => set({ fileTree: tree }),

  setLoadingTree: (loading) => set({ isLoadingTree: loading }),

  toggleFolder: (path) =>
    set((state) => ({
      fileTree: toggleFolderInTree(state.fileTree, path),
    })),

  setFolderChildren: (path, children) =>
    set((state) => ({
      fileTree: setChildrenInTree(state.fileTree, path, children),
    })),

  setFolderLoading: (path, loading) =>
    set((state) => ({
      fileTree: setLoadingInTree(state.fileTree, path, loading),
    })),

  openFile: (file) =>
    set((state) => {
      const exists = state.openFiles.find((f) => f.path === file.path)
      if (exists) {
        return { activeFilePath: file.path }
      }
      return {
        openFiles: [...state.openFiles, file],
        activeFilePath: file.path,
      }
    }),

  closeFile: (path) =>
    set((state) => {
      const newFiles = state.openFiles.filter((f) => f.path !== path)
      let newActive = state.activeFilePath

      if (state.activeFilePath === path) {
        const index = state.openFiles.findIndex((f) => f.path === path)
        newActive = newFiles[index]?.path || newFiles[index - 1]?.path || null
      }

      return { openFiles: newFiles, activeFilePath: newActive }
    }),

  setActiveFile: (path) => set({ activeFilePath: path }),

  updateFileContent: (path, content) =>
    set((state) => ({
      openFiles: state.openFiles.map((f) =>
        f.path === path
          ? { ...f, content, isDirty: content !== f.originalContent }
          : f
      ),
    })),

  markFileSaved: (path) =>
    set((state) => ({
      openFiles: state.openFiles.map((f) =>
        f.path === path
          ? { ...f, isDirty: false, originalContent: f.content }
          : f
      ),
    })),

  closeAllFiles: () => set({ openFiles: [], activeFilePath: null }),
}))

// Helper functions
function toggleFolderInTree(tree: FileNode[], path: string): FileNode[] {
  return tree.map((node) => {
    if (node.path === path) {
      return { ...node, isExpanded: !node.isExpanded }
    }
    if (node.children) {
      return { ...node, children: toggleFolderInTree(node.children, path) }
    }
    return node
  })
}

function setChildrenInTree(
  tree: FileNode[],
  path: string,
  children: FileNode[]
): FileNode[] {
  return tree.map((node) => {
    if (node.path === path) {
      return { ...node, children, isExpanded: true, isLoading: false }
    }
    if (node.children) {
      return { ...node, children: setChildrenInTree(node.children, path, children) }
    }
    return node
  })
}

function setLoadingInTree(
  tree: FileNode[],
  path: string,
  loading: boolean
): FileNode[] {
  return tree.map((node) => {
    if (node.path === path) {
      return { ...node, isLoading: loading }
    }
    if (node.children) {
      return { ...node, children: setLoadingInTree(node.children, path, loading) }
    }
    return node
  })
}

// Selectors
export const useActiveFile = () => {
  const { openFiles, activeFilePath } = useFileStore()
  return openFiles.find((f) => f.path === activeFilePath)
}

export const useHasUnsavedFiles = () => {
  const { openFiles } = useFileStore()
  return openFiles.some((f) => f.isDirty)
}
