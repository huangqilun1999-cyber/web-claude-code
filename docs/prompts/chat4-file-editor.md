# Chat 4 提示词：文件管理 + 编辑器

## 任务说明
你正在参与开发 "Web Claude Code" 平台。**你的职责**：文件树浏览、Monaco代码编辑器、目录切换功能。

## 工作目录
```
d:\github\Web-Claude code\apps\web
```

## 技术栈
- React + TypeScript
- @monaco-editor/react (Monaco编辑器)
- Zustand (状态管理)
- lucide-react (图标)

---

## 详细任务清单

### 阶段1：文件状态管理

1. **创建 src/stores/file-store.ts**
```typescript
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
```

---

### 阶段2：文件树组件

1. **创建 src/components/file-tree/file-tree.tsx**
```typescript
'use client'

import { useEffect, useCallback } from 'react'
import { useWS } from '@/lib/websocket'
import { useFileStore, FileNode } from '@/stores/file-store'
import { useAgentStore } from '@/stores/agent-store'
import { FileNodeItem } from './file-node'
import { FolderOpen, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileTreeProps {
  className?: string
}

export function FileTree({ className }: FileTreeProps) {
  const { send, subscribe, isConnected } = useWS()
  const { selectedAgentId } = useAgentStore()
  const {
    rootPath,
    fileTree,
    isLoadingTree,
    setFileTree,
    setLoadingTree,
    setFolderChildren,
    setFolderLoading,
    toggleFolder,
    openFile,
  } = useFileStore()

  // 加载根目录
  const loadRootDirectory = useCallback(
    async (path: string) => {
      if (!selectedAgentId || !isConnected) return

      setLoadingTree(true)
      try {
        send('client:file', {
          agentId: selectedAgentId,
          action: 'list',
          path: path || '.',
        })
      } catch (error) {
        console.error('Failed to load directory:', error)
        setLoadingTree(false)
      }
    },
    [selectedAgentId, isConnected, send, setLoadingTree]
  )

  // 加载子目录
  const loadDirectory = useCallback(
    async (path: string) => {
      if (!selectedAgentId || !isConnected) return

      setFolderLoading(path, true)
      try {
        send('client:file', {
          agentId: selectedAgentId,
          action: 'list',
          path,
        })
      } catch (error) {
        console.error('Failed to load directory:', error)
        setFolderLoading(path, false)
      }
    },
    [selectedAgentId, isConnected, send, setFolderLoading]
  )

  // 订阅文件列表响应
  useEffect(() => {
    const unsubscribe = subscribe('server:file_result', (message) => {
      const { success, data, error } = message.payload

      if (!success) {
        console.error('File operation failed:', error)
        setLoadingTree(false)
        return
      }

      if (data?.files) {
        const files: FileNode[] = data.files.map((f: any) => ({
          name: f.name,
          path: f.path,
          type: f.type,
          size: f.size,
          modifiedAt: f.modifiedAt,
          extension: f.extension,
          children: f.type === 'directory' ? undefined : undefined,
        }))

        // 判断是根目录还是子目录
        if (data.path === rootPath || !rootPath) {
          setFileTree(files)
          setLoadingTree(false)
        } else {
          setFolderChildren(data.path, files)
        }
      }
    })

    return unsubscribe
  }, [subscribe, rootPath, setFileTree, setLoadingTree, setFolderChildren])

  // 初始加载
  useEffect(() => {
    if (rootPath && selectedAgentId && isConnected) {
      loadRootDirectory(rootPath)
    }
  }, [rootPath, selectedAgentId, isConnected, loadRootDirectory])

  // 处理文件夹点击
  const handleFolderClick = useCallback(
    (node: FileNode) => {
      if (node.children) {
        toggleFolder(node.path)
      } else {
        loadDirectory(node.path)
      }
    },
    [toggleFolder, loadDirectory]
  )

  // 处理文件点击
  const handleFileClick = useCallback(
    async (node: FileNode) => {
      if (!selectedAgentId || !isConnected) return

      // 读取文件内容
      send('client:file', {
        agentId: selectedAgentId,
        action: 'read',
        path: node.path,
      })
    },
    [selectedAgentId, isConnected, send]
  )

  // 订阅文件内容响应
  useEffect(() => {
    const unsubscribe = subscribe('server:file_result', (message) => {
      const { success, data } = message.payload

      if (success && data?.content !== undefined) {
        const language = getLanguageFromExtension(data.extension || '')
        openFile({
          path: data.path,
          name: data.name,
          content: data.content,
          language,
          isDirty: false,
          originalContent: data.content,
        })
      }
    })

    return unsubscribe
  }, [subscribe, openFile])

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FolderOpen className="w-4 h-4" />
          <span className="truncate">{rootPath || '文件'}</span>
        </div>
        <button
          onClick={() => loadRootDirectory(rootPath)}
          disabled={isLoadingTree}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <RefreshCw
            className={cn('w-4 h-4', isLoadingTree && 'animate-spin')}
          />
        </button>
      </div>

      {/* 文件树 */}
      <div className="flex-1 overflow-auto p-2">
        {isLoadingTree ? (
          <div className="text-sm text-gray-500 text-center py-4">
            加载中...
          </div>
        ) : fileTree.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">
            暂无文件
          </div>
        ) : (
          <div className="space-y-0.5">
            {fileTree.map((node) => (
              <FileNodeItem
                key={node.path}
                node={node}
                depth={0}
                onFolderClick={handleFolderClick}
                onFileClick={handleFileClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// 根据扩展名获取语言
function getLanguageFromExtension(ext: string): string {
  const map: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    rb: 'ruby',
    java: 'java',
    go: 'go',
    rs: 'rust',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    ps1: 'powershell',
    dockerfile: 'dockerfile',
    makefile: 'makefile',
  }

  return map[ext.toLowerCase()] || 'plaintext'
}
```

2. **创建 src/components/file-tree/file-node.tsx**
```typescript
'use client'

import { memo } from 'react'
import { FileNode } from '@/stores/file-store'
import { FileIcon } from './file-icons'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileNodeItemProps {
  node: FileNode
  depth: number
  onFolderClick: (node: FileNode) => void
  onFileClick: (node: FileNode) => void
}

export const FileNodeItem = memo(function FileNodeItem({
  node,
  depth,
  onFolderClick,
  onFileClick,
}: FileNodeItemProps) {
  const isFolder = node.type === 'directory'
  const paddingLeft = depth * 12 + 8

  const handleClick = () => {
    if (isFolder) {
      onFolderClick(node)
    } else {
      onFileClick(node)
    }
  }

  return (
    <>
      <div
        onClick={handleClick}
        className={cn(
          'flex items-center gap-1 py-1 px-2 rounded cursor-pointer',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'text-sm'
        )}
        style={{ paddingLeft }}
      >
        {/* 展开/折叠图标 */}
        {isFolder ? (
          node.isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : node.isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )
        ) : (
          <span className="w-4" />
        )}

        {/* 文件/文件夹图标 */}
        {isFolder ? (
          node.isExpanded ? (
            <FolderOpen className="w-4 h-4 text-yellow-500" />
          ) : (
            <Folder className="w-4 h-4 text-yellow-500" />
          )
        ) : (
          <FileIcon extension={node.extension || ''} />
        )}

        {/* 文件名 */}
        <span className="truncate">{node.name}</span>
      </div>

      {/* 子节点 */}
      {isFolder && node.isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileNodeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              onFolderClick={onFolderClick}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </>
  )
})
```

3. **创建 src/components/file-tree/file-icons.tsx**
```typescript
'use client'

import {
  FileText,
  FileCode,
  FileJson,
  FileImage,
  File,
  FileType,
} from 'lucide-react'

interface FileIconProps {
  extension: string
  className?: string
}

export function FileIcon({ extension, className = 'w-4 h-4' }: FileIconProps) {
  const ext = extension.toLowerCase()

  // 代码文件
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'go', 'rs', 'c', 'cpp', 'h', 'cs', 'php', 'rb', 'swift', 'kt'].includes(ext)) {
    return <FileCode className={`${className} text-blue-500`} />
  }

  // JSON文件
  if (['json', 'jsonc'].includes(ext)) {
    return <FileJson className={`${className} text-yellow-500`} />
  }

  // 配置文件
  if (['yaml', 'yml', 'toml', 'ini', 'env'].includes(ext)) {
    return <FileText className={`${className} text-purple-500`} />
  }

  // 文档文件
  if (['md', 'txt', 'doc', 'docx', 'pdf'].includes(ext)) {
    return <FileText className={`${className} text-gray-500`} />
  }

  // 图片文件
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp'].includes(ext)) {
    return <FileImage className={`${className} text-green-500`} />
  }

  // HTML/CSS
  if (['html', 'htm', 'css', 'scss', 'less'].includes(ext)) {
    return <FileCode className={`${className} text-orange-500`} />
  }

  // 默认
  return <File className={`${className} text-gray-400`} />
}
```

---

### 阶段3：Monaco编辑器

1. **创建 src/components/editor/code-editor.tsx**
```typescript
'use client'

import { useCallback, useRef } from 'react'
import Editor, { OnMount, OnChange } from '@monaco-editor/react'
import { useFileStore, useActiveFile } from '@/stores/file-store'
import { useWS } from '@/lib/websocket'
import { useAgentStore } from '@/stores/agent-store'
import { EditorTabs } from './editor-tabs'
import { EditorToolbar } from './editor-toolbar'

interface CodeEditorProps {
  className?: string
}

export function CodeEditor({ className }: CodeEditorProps) {
  const { send, isConnected } = useWS()
  const { selectedAgentId } = useAgentStore()
  const { updateFileContent, markFileSaved } = useFileStore()
  const activeFile = useActiveFile()
  const editorRef = useRef<any>(null)

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor

    // 添加保存快捷键
    editor.addCommand(
      // Ctrl+S / Cmd+S
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      () => {
        handleSave()
      }
    )
  }

  const handleChange: OnChange = (value) => {
    if (activeFile && value !== undefined) {
      updateFileContent(activeFile.path, value)
    }
  }

  const handleSave = useCallback(async () => {
    if (!activeFile || !selectedAgentId || !isConnected) return

    try {
      send('client:file', {
        agentId: selectedAgentId,
        action: 'write',
        path: activeFile.path,
        content: activeFile.content,
      })

      markFileSaved(activeFile.path)
    } catch (error) {
      console.error('Failed to save file:', error)
    }
  }, [activeFile, selectedAgentId, isConnected, send, markFileSaved])

  if (!activeFile) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-lg mb-2">没有打开的文件</p>
          <p className="text-sm">从文件树中选择一个文件</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <EditorTabs />
      <EditorToolbar onSave={handleSave} />
      <div className="flex-1">
        <Editor
          height="100%"
          language={activeFile.language}
          value={activeFile.content}
          onChange={handleChange}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>
    </div>
  )
}
```

2. **创建 src/components/editor/editor-tabs.tsx**
```typescript
'use client'

import { useFileStore, OpenFile } from '@/stores/file-store'
import { X, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EditorTabs() {
  const { openFiles, activeFilePath, setActiveFile, closeFile } = useFileStore()

  if (openFiles.length === 0) {
    return null
  }

  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 border-b overflow-x-auto">
      {openFiles.map((file) => (
        <div
          key={file.path}
          className={cn(
            'flex items-center gap-2 px-3 py-2 border-r cursor-pointer',
            'hover:bg-gray-200 dark:hover:bg-gray-700',
            activeFilePath === file.path &&
              'bg-white dark:bg-gray-900 border-b-2 border-b-blue-500'
          )}
          onClick={() => setActiveFile(file.path)}
        >
          <span className="text-sm truncate max-w-32">{file.name}</span>

          {/* 未保存指示器 */}
          {file.isDirty && (
            <Circle className="w-2 h-2 fill-current text-blue-500" />
          )}

          {/* 关闭按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (file.isDirty) {
                if (confirm('文件未保存，确定要关闭吗？')) {
                  closeFile(file.path)
                }
              } else {
                closeFile(file.path)
              }
            }}
            className="p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
```

3. **创建 src/components/editor/editor-toolbar.tsx**
```typescript
'use client'

import { useFileStore, useActiveFile, useHasUnsavedFiles } from '@/stores/file-store'
import { Save, Undo, Redo, Search, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditorToolbarProps {
  onSave: () => void
}

export function EditorToolbar({ onSave }: EditorToolbarProps) {
  const activeFile = useActiveFile()
  const hasUnsaved = useHasUnsavedFiles()

  return (
    <div className="flex items-center justify-between px-2 py-1 bg-gray-50 dark:bg-gray-800 border-b">
      <div className="flex items-center gap-1">
        {/* 保存按钮 */}
        <button
          onClick={onSave}
          disabled={!activeFile?.isDirty}
          className={cn(
            'p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            activeFile?.isDirty && 'text-blue-500'
          )}
          title="保存 (Ctrl+S)"
        >
          <Save className="w-4 h-4" />
        </button>

        {/* 撤销 */}
        <button
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="撤销 (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>

        {/* 重做 */}
        <button
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="重做 (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* 搜索 */}
        <button
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="搜索 (Ctrl+F)"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* 文件信息 */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {activeFile && (
          <>
            <span>{activeFile.language}</span>
            <span>•</span>
            <span>UTF-8</span>
            {activeFile.isDirty && (
              <>
                <span>•</span>
                <span className="text-blue-500">已修改</span>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
```

---

### 阶段4：文件管理工具栏

1. **创建 src/components/file-tree/file-tree-toolbar.tsx**
```typescript
'use client'

import { useState } from 'react'
import { useWS } from '@/lib/websocket'
import { useFileStore } from '@/stores/file-store'
import { useAgentStore } from '@/stores/agent-store'
import {
  FilePlus,
  FolderPlus,
  Trash2,
  Edit3,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function FileTreeToolbar() {
  const { send, isConnected } = useWS()
  const { selectedAgentId } = useAgentStore()
  const { rootPath } = useFileStore()
  const [showMenu, setShowMenu] = useState(false)

  const handleNewFile = async () => {
    const name = prompt('输入文件名：')
    if (!name) return

    if (!selectedAgentId || !isConnected) {
      alert('请先连接Agent')
      return
    }

    send('client:file', {
      agentId: selectedAgentId,
      action: 'write',
      path: `${rootPath}/${name}`,
      content: '',
    })
  }

  const handleNewFolder = async () => {
    const name = prompt('输入文件夹名：')
    if (!name) return

    if (!selectedAgentId || !isConnected) {
      alert('请先连接Agent')
      return
    }

    send('client:file', {
      agentId: selectedAgentId,
      action: 'mkdir',
      path: `${rootPath}/${name}`,
    })
  }

  return (
    <div className="flex items-center gap-1 p-2 border-b">
      <button
        onClick={handleNewFile}
        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        title="新建文件"
      >
        <FilePlus className="w-4 h-4" />
      </button>

      <button
        onClick={handleNewFolder}
        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        title="新建文件夹"
      >
        <FolderPlus className="w-4 h-4" />
      </button>

      <div className="relative ml-auto">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border py-1 z-10">
            <button
              onClick={() => {
                // TODO: 实现重命名
                setShowMenu(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Edit3 className="w-4 h-4" />
              重命名
            </button>
            <button
              onClick={() => {
                // TODO: 实现删除
                setShowMenu(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
            >
              <Trash2 className="w-4 h-4" />
              删除
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

### 阶段5：工作区布局更新

1. **更新 src/app/(dashboard)/workspace/page.tsx**
```typescript
'use client'

import { useEffect, useState } from 'react'
import { useWS } from '@/lib/websocket'
import { useAgentStore } from '@/stores/agent-store'
import { useFileStore } from '@/stores/file-store'
import { ChatContainer } from '@/components/chat/chat-container'
import { FileTree } from '@/components/file-tree/file-tree'
import { FileTreeToolbar } from '@/components/file-tree/file-tree-toolbar'
import { CodeEditor } from '@/components/editor/code-editor'
import { ResizablePanel } from '@/components/layout/resizable-panel'

export default function WorkspacePage() {
  const { subscribe } = useWS()
  const { updateAgentStatus, selectedAgentId } = useAgentStore()
  const { setRootPath } = useFileStore()
  const [view, setView] = useState<'chat' | 'editor'>('chat')

  // 监听Agent状态变化
  useEffect(() => {
    const unsubscribe = subscribe('server:agent_status', (message) => {
      const { agentId, isOnline, systemInfo } = message.payload
      updateAgentStatus(agentId, isOnline, systemInfo)

      // 设置默认工作目录
      if (isOnline && systemInfo?.homeDir && agentId === selectedAgentId) {
        setRootPath(systemInfo.homeDir)
      }
    })

    return unsubscribe
  }, [subscribe, updateAgentStatus, selectedAgentId, setRootPath])

  return (
    <div className="h-full flex">
      {/* 文件树 */}
      <div className="w-64 border-r flex flex-col">
        <FileTreeToolbar />
        <FileTree className="flex-1" />
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 视图切换 */}
        <div className="flex border-b">
          <button
            onClick={() => setView('chat')}
            className={`px-4 py-2 text-sm ${
              view === 'chat'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500'
            }`}
          >
            对话
          </button>
          <button
            onClick={() => setView('editor')}
            className={`px-4 py-2 text-sm ${
              view === 'editor'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500'
            }`}
          >
            编辑器
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-hidden">
          {view === 'chat' ? <ChatContainer /> : <CodeEditor />}
        </div>
      </div>
    </div>
  )
}
```

2. **创建 src/components/layout/resizable-panel.tsx**
```typescript
'use client'

import { useState, useCallback, useRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ResizablePanelProps {
  children: ReactNode
  direction?: 'horizontal' | 'vertical'
  initialSize?: number
  minSize?: number
  maxSize?: number
  className?: string
}

export function ResizablePanel({
  children,
  direction = 'horizontal',
  initialSize = 256,
  minSize = 200,
  maxSize = 500,
  className,
}: ResizablePanelProps) {
  const [size, setSize] = useState(initialSize)
  const isDragging = useRef(false)
  const startPos = useRef(0)
  const startSize = useRef(0)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true
      startPos.current = direction === 'horizontal' ? e.clientX : e.clientY
      startSize.current = size

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return

        const currentPos = direction === 'horizontal' ? e.clientX : e.clientY
        const delta = currentPos - startPos.current
        const newSize = Math.min(
          maxSize,
          Math.max(minSize, startSize.current + delta)
        )
        setSize(newSize)
      }

      const handleMouseUp = () => {
        isDragging.current = false
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [direction, size, minSize, maxSize]
  )

  return (
    <div
      className={cn('relative flex-shrink-0', className)}
      style={{
        [direction === 'horizontal' ? 'width' : 'height']: size,
      }}
    >
      {children}

      {/* 拖动条 */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          'absolute bg-transparent hover:bg-blue-500 transition-colors',
          direction === 'horizontal'
            ? 'right-0 top-0 w-1 h-full cursor-col-resize'
            : 'bottom-0 left-0 h-1 w-full cursor-row-resize'
        )}
      />
    </div>
  )
}
```

---

## 输出要求

1. 文件树正常显示
2. 文件可以打开编辑
3. 编辑器语法高亮正常
4. 文件保存功能正常

## 完成标志

- [ ] 文件状态管理完成
- [ ] 文件树组件完成
- [ ] Monaco编辑器集成完成
- [ ] 文件打开/保存正常
- [ ] 编辑器标签页正常
- [ ] 未保存提示正常

## 注意事项

1. **Monaco编辑器**需要动态导入
2. 文件树需要**懒加载**
3. 大文件需要分片读取
4. 注意内存管理
