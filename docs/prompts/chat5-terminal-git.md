# Chat 5 提示词：终端 + Git集成

## 任务说明
你正在参与开发 "Web Claude Code" 平台。**你的职责**：Web终端（xterm.js）和Git集成功能。

## 工作目录
```
d:\github\Web-Claude code
```

## 技术栈
- React + TypeScript
- xterm.js + xterm-addon-fit (终端模拟)
- Zustand (状态管理)
- simple-git (Agent端Git操作)

---

## 详细任务清单

### 阶段1：终端状态管理

1. **创建 apps/web/src/stores/terminal-store.ts**
```typescript
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
```

---

### 阶段2：xterm终端组件

1. **创建 apps/web/src/components/terminal/terminal.tsx**
```typescript
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import 'xterm/css/xterm.css'
import { useWS } from '@/lib/websocket'
import { useAgentStore } from '@/stores/agent-store'
import { useTerminalStore } from '@/stores/terminal-store'

interface TerminalProps {
  terminalId: string
  isActive: boolean
}

export function Terminal({ terminalId, isActive }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const { send, subscribe, isConnected } = useWS()
  const { selectedAgentId } = useAgentStore()

  // 初始化终端
  useEffect(() => {
    if (!containerRef.current || terminalRef.current) return

    const terminal = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        cursorAccent: '#000000',
        selectionBackground: '#264f78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
      },
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    terminal.loadAddon(fitAddon)
    terminal.loadAddon(webLinksAddon)

    terminal.open(containerRef.current)
    fitAddon.fit()

    terminalRef.current = terminal
    fitAddonRef.current = fitAddon

    // 监听用户输入
    terminal.onData((data) => {
      if (selectedAgentId && isConnected) {
        send('client:terminal', {
          agentId: selectedAgentId,
          action: 'input',
          terminalId,
          data,
        })
      }
    })

    // 监听终端大小变化
    terminal.onResize(({ cols, rows }) => {
      if (selectedAgentId && isConnected) {
        send('client:terminal', {
          agentId: selectedAgentId,
          action: 'resize',
          terminalId,
          cols,
          rows,
        })
      }
    })

    // 请求创建终端
    if (selectedAgentId && isConnected) {
      send('client:terminal', {
        agentId: selectedAgentId,
        action: 'create',
        terminalId,
        cols: terminal.cols,
        rows: terminal.rows,
      })
    }

    return () => {
      terminal.dispose()
      terminalRef.current = null
      fitAddonRef.current = null
    }
  }, [terminalId, selectedAgentId, isConnected, send])

  // 订阅终端输出
  useEffect(() => {
    const unsubscribe = subscribe('server:terminal_output', (message) => {
      const { terminalId: msgTerminalId, data } = message.payload

      if (msgTerminalId === terminalId && terminalRef.current) {
        terminalRef.current.write(data)
      }
    })

    return unsubscribe
  }, [terminalId, subscribe])

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current && isActive) {
        fitAddonRef.current.fit()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isActive])

  // 激活时重新fit
  useEffect(() => {
    if (isActive && fitAddonRef.current) {
      setTimeout(() => fitAddonRef.current?.fit(), 0)
    }
  }, [isActive])

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ display: isActive ? 'block' : 'none' }}
    />
  )
}
```

2. **创建 apps/web/src/components/terminal/terminal-container.tsx**
```typescript
'use client'

import { useCallback } from 'react'
import { useTerminalStore, useActiveTerminal } from '@/stores/terminal-store'
import { useAgentStore } from '@/stores/agent-store'
import { useWS } from '@/lib/websocket'
import { Terminal } from './terminal'
import { TerminalTabs } from './terminal-tabs'
import { Plus, Trash2 } from 'lucide-react'

export function TerminalContainer() {
  const { send, isConnected } = useWS()
  const { selectedAgentId } = useAgentStore()
  const { terminals, activeTerminalId, addTerminal, removeTerminal } =
    useTerminalStore()

  const handleCreateTerminal = useCallback(() => {
    if (!selectedAgentId || !isConnected) {
      alert('请先连接Agent')
      return
    }

    const id = `terminal-${Date.now()}`
    addTerminal({
      id,
      name: `终端 ${terminals.length + 1}`,
      isActive: true,
      workingDirectory: '~',
    })
  }, [selectedAgentId, isConnected, terminals.length, addTerminal])

  const handleCloseTerminal = useCallback(
    (id: string) => {
      if (selectedAgentId && isConnected) {
        send('client:terminal', {
          agentId: selectedAgentId,
          action: 'close',
          terminalId: id,
        })
      }
      removeTerminal(id)
    },
    [selectedAgentId, isConnected, send, removeTerminal]
  )

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* 标签栏 */}
      <div className="flex items-center bg-gray-800 border-b border-gray-700">
        <TerminalTabs onClose={handleCloseTerminal} />

        <button
          onClick={handleCreateTerminal}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700"
          title="新建终端"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* 终端区域 */}
      <div className="flex-1 relative">
        {terminals.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="mb-2">没有打开的终端</p>
              <button
                onClick={handleCreateTerminal}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                新建终端
              </button>
            </div>
          </div>
        ) : (
          terminals.map((terminal) => (
            <Terminal
              key={terminal.id}
              terminalId={terminal.id}
              isActive={terminal.id === activeTerminalId}
            />
          ))
        )}
      </div>
    </div>
  )
}
```

3. **创建 apps/web/src/components/terminal/terminal-tabs.tsx**
```typescript
'use client'

import { useTerminalStore } from '@/stores/terminal-store'
import { X, Terminal as TerminalIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TerminalTabsProps {
  onClose: (id: string) => void
}

export function TerminalTabs({ onClose }: TerminalTabsProps) {
  const { terminals, activeTerminalId, setActiveTerminal } = useTerminalStore()

  return (
    <div className="flex-1 flex overflow-x-auto">
      {terminals.map((terminal) => (
        <div
          key={terminal.id}
          className={cn(
            'flex items-center gap-2 px-3 py-2 cursor-pointer border-r border-gray-700',
            'hover:bg-gray-700',
            activeTerminalId === terminal.id && 'bg-gray-900'
          )}
          onClick={() => setActiveTerminal(terminal.id)}
        >
          <TerminalIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-300">{terminal.name}</span>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose(terminal.id)
            }}
            className="p-0.5 rounded hover:bg-gray-600"
          >
            <X className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      ))}
    </div>
  )
}
```

---

### 阶段3：Agent端终端处理

1. **更新 apps/agent/src/handlers/terminal.ts**
```typescript
import * as pty from 'node-pty'
import os from 'os'

interface PtyProcess {
  id: string
  process: pty.IPty
  onData: (data: string) => void
}

export class TerminalHandler {
  private terminals = new Map<string, PtyProcess>()

  create(onData: (data: string) => void): { id: string } {
    const id = `pty-${Date.now()}`
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash'

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: os.homedir(),
      env: process.env as Record<string, string>,
    })

    ptyProcess.onData((data) => {
      onData(data)
    })

    this.terminals.set(id, {
      id,
      process: ptyProcess,
      onData,
    })

    return { id }
  }

  write(terminalId: string, data: string): void {
    const terminal = this.terminals.get(terminalId)
    if (terminal) {
      terminal.process.write(data)
    }
  }

  resize(terminalId: string, cols: number, rows: number): void {
    const terminal = this.terminals.get(terminalId)
    if (terminal) {
      terminal.process.resize(cols, rows)
    }
  }

  close(terminalId: string): void {
    const terminal = this.terminals.get(terminalId)
    if (terminal) {
      terminal.process.kill()
      this.terminals.delete(terminalId)
    }
  }

  closeAll(): void {
    this.terminals.forEach((terminal) => {
      terminal.process.kill()
    })
    this.terminals.clear()
  }
}
```

---

### 阶段4：Git状态管理

1. **创建 apps/web/src/stores/git-store.ts**
```typescript
import { create } from 'zustand'

export interface GitStatus {
  branch: string
  ahead: number
  behind: number
  staged: string[]
  unstaged: string[]
  untracked: string[]
  isClean: boolean
}

export interface GitBranch {
  name: string
  current: boolean
  remote?: string
  commit?: string
}

export interface GitCommit {
  hash: string
  shortHash: string
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
```

---

### 阶段5：Git面板组件

1. **创建 apps/web/src/components/git/git-panel.tsx**
```typescript
'use client'

import { useEffect, useCallback } from 'react'
import { useWS } from '@/lib/websocket'
import { useAgentStore } from '@/stores/agent-store'
import { useFileStore } from '@/stores/file-store'
import { useGitStore } from '@/stores/git-store'
import { GitStatus } from './git-status'
import { GitBranches } from './git-branches'
import { GitCommitForm } from './git-commit-form'
import { GitHistory } from './git-history'
import { RefreshCw, GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils'

export function GitPanel() {
  const { send, subscribe, isConnected } = useWS()
  const { selectedAgentId } = useAgentStore()
  const { rootPath } = useFileStore()
  const { status, isLoading, setStatus, setBranches, setCommits, setLoading, setError } =
    useGitStore()

  // 加载Git状态
  const loadStatus = useCallback(() => {
    if (!selectedAgentId || !isConnected || !rootPath) return

    setLoading(true)
    send('client:git', {
      agentId: selectedAgentId,
      action: 'status',
      workingDirectory: rootPath,
    })
  }, [selectedAgentId, isConnected, rootPath, send, setLoading])

  // 加载分支列表
  const loadBranches = useCallback(() => {
    if (!selectedAgentId || !isConnected || !rootPath) return

    send('client:git', {
      agentId: selectedAgentId,
      action: 'branch',
      workingDirectory: rootPath,
    })
  }, [selectedAgentId, isConnected, rootPath, send])

  // 加载提交历史
  const loadHistory = useCallback(() => {
    if (!selectedAgentId || !isConnected || !rootPath) return

    send('client:git', {
      agentId: selectedAgentId,
      action: 'log',
      workingDirectory: rootPath,
      params: { limit: 20 },
    })
  }, [selectedAgentId, isConnected, rootPath, send])

  // 订阅Git操作结果
  useEffect(() => {
    const unsubscribe = subscribe('server:git_result', (message) => {
      const { success, data, error } = message.payload

      setLoading(false)

      if (!success) {
        setError(error || '操作失败')
        return
      }

      if (data?.status) {
        setStatus(data.status)
      }
      if (data?.branches) {
        setBranches(data.branches)
      }
      if (data?.commits) {
        setCommits(data.commits)
      }
    })

    return unsubscribe
  }, [subscribe, setStatus, setBranches, setCommits, setLoading, setError])

  // 初始加载
  useEffect(() => {
    if (rootPath) {
      loadStatus()
      loadBranches()
      loadHistory()
    }
  }, [rootPath, loadStatus, loadBranches, loadHistory])

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5" />
          <span className="font-medium">Git</span>
          {status && (
            <span className="text-sm text-gray-500">({status.branch})</span>
          )}
        </div>

        <button
          onClick={loadStatus}
          disabled={isLoading}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <RefreshCw
            className={cn('w-4 h-4', isLoading && 'animate-spin')}
          />
        </button>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-auto">
        {!rootPath ? (
          <div className="p-4 text-center text-gray-500">
            请先选择工作目录
          </div>
        ) : (
          <div className="divide-y">
            <GitStatus />
            <GitCommitForm onCommit={loadStatus} />
            <GitBranches onSwitch={loadStatus} />
            <GitHistory />
          </div>
        )}
      </div>
    </div>
  )
}
```

2. **创建 apps/web/src/components/git/git-status.tsx**
```typescript
'use client'

import { useGitStore } from '@/stores/git-store'
import { FileText, FilePlus, FileX, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function GitStatus() {
  const { status, isLoading } = useGitStore()

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">加载中...</div>
    )
  }

  if (!status) {
    return (
      <div className="p-4 text-center text-gray-500">
        无法获取Git状态
      </div>
    )
  }

  const hasChanges =
    status.staged.length > 0 ||
    status.unstaged.length > 0 ||
    status.untracked.length > 0

  return (
    <div className="p-3">
      <h3 className="font-medium mb-2 flex items-center gap-2">
        {hasChanges ? (
          <>
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            <span>有未提交的更改</span>
          </>
        ) : (
          <>
            <Check className="w-4 h-4 text-green-500" />
            <span>工作区干净</span>
          </>
        )}
      </h3>

      {/* 已暂存 */}
      {status.staged.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm text-gray-500 mb-1">
            已暂存 ({status.staged.length})
          </h4>
          <ul className="space-y-1">
            {status.staged.map((file) => (
              <li
                key={file}
                className="flex items-center gap-2 text-sm text-green-600"
              >
                <FilePlus className="w-4 h-4" />
                <span className="truncate">{file}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 未暂存 */}
      {status.unstaged.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm text-gray-500 mb-1">
            已修改 ({status.unstaged.length})
          </h4>
          <ul className="space-y-1">
            {status.unstaged.map((file) => (
              <li
                key={file}
                className="flex items-center gap-2 text-sm text-yellow-600"
              >
                <FileText className="w-4 h-4" />
                <span className="truncate">{file}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 未跟踪 */}
      {status.untracked.length > 0 && (
        <div>
          <h4 className="text-sm text-gray-500 mb-1">
            未跟踪 ({status.untracked.length})
          </h4>
          <ul className="space-y-1">
            {status.untracked.map((file) => (
              <li
                key={file}
                className="flex items-center gap-2 text-sm text-gray-500"
              >
                <FileX className="w-4 h-4" />
                <span className="truncate">{file}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 同步状态 */}
      {(status.ahead > 0 || status.behind > 0) && (
        <div className="mt-3 text-sm text-gray-500">
          {status.ahead > 0 && <span>↑ {status.ahead} 待推送</span>}
          {status.ahead > 0 && status.behind > 0 && <span> • </span>}
          {status.behind > 0 && <span>↓ {status.behind} 待拉取</span>}
        </div>
      )}
    </div>
  )
}
```

3. **创建 apps/web/src/components/git/git-commit-form.tsx**
```typescript
'use client'

import { useState, useCallback } from 'react'
import { useWS } from '@/lib/websocket'
import { useAgentStore } from '@/stores/agent-store'
import { useFileStore } from '@/stores/file-store'
import { useGitStore } from '@/stores/git-store'

interface GitCommitFormProps {
  onCommit?: () => void
}

export function GitCommitForm({ onCommit }: GitCommitFormProps) {
  const { send, isConnected } = useWS()
  const { selectedAgentId } = useAgentStore()
  const { rootPath } = useFileStore()
  const { status, setLoading } = useGitStore()
  const [message, setMessage] = useState('')
  const [isCommitting, setIsCommitting] = useState(false)

  const hasChanges =
    status &&
    (status.staged.length > 0 ||
      status.unstaged.length > 0 ||
      status.untracked.length > 0)

  const handleStageAll = useCallback(() => {
    if (!selectedAgentId || !isConnected || !rootPath) return

    // 使用终端执行 git add .
    send('client:terminal', {
      agentId: selectedAgentId,
      action: 'input',
      data: 'git add .\n',
    })

    setTimeout(() => onCommit?.(), 1000)
  }, [selectedAgentId, isConnected, rootPath, send, onCommit])

  const handleCommit = useCallback(async () => {
    if (!selectedAgentId || !isConnected || !rootPath || !message.trim()) return

    setIsCommitting(true)
    setLoading(true)

    try {
      send('client:git', {
        agentId: selectedAgentId,
        action: 'commit',
        workingDirectory: rootPath,
        params: { message: message.trim() },
      })

      setMessage('')
      setTimeout(() => {
        onCommit?.()
        setIsCommitting(false)
      }, 1000)
    } catch (error) {
      console.error('Commit failed:', error)
      setIsCommitting(false)
    }
  }, [selectedAgentId, isConnected, rootPath, message, send, setLoading, onCommit])

  const handlePush = useCallback(() => {
    if (!selectedAgentId || !isConnected || !rootPath) return

    send('client:git', {
      agentId: selectedAgentId,
      action: 'push',
      workingDirectory: rootPath,
    })
  }, [selectedAgentId, isConnected, rootPath, send])

  const handlePull = useCallback(() => {
    if (!selectedAgentId || !isConnected || !rootPath) return

    send('client:git', {
      agentId: selectedAgentId,
      action: 'pull',
      workingDirectory: rootPath,
    })

    setTimeout(() => onCommit?.(), 2000)
  }, [selectedAgentId, isConnected, rootPath, send, onCommit])

  if (!hasChanges && !status?.ahead && !status?.behind) {
    return null
  }

  return (
    <div className="p-3">
      {hasChanges && (
        <>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="提交信息..."
            className="w-full px-3 py-2 border rounded-lg resize-none text-sm"
            rows={3}
          />

          <div className="flex gap-2 mt-2">
            <button
              onClick={handleStageAll}
              className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              暂存全部
            </button>
            <button
              onClick={handleCommit}
              disabled={!message.trim() || isCommitting}
              className="flex-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isCommitting ? '提交中...' : '提交'}
            </button>
          </div>
        </>
      )}

      {(status?.ahead || status?.behind) && (
        <div className="flex gap-2 mt-2">
          {status.ahead > 0 && (
            <button
              onClick={handlePush}
              className="flex-1 px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              推送 ({status.ahead})
            </button>
          )}
          {status.behind > 0 && (
            <button
              onClick={handlePull}
              className="flex-1 px-3 py-1.5 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              拉取 ({status.behind})
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

4. **创建 apps/web/src/components/git/git-branches.tsx**
```typescript
'use client'

import { useState, useCallback } from 'react'
import { useWS } from '@/lib/websocket'
import { useAgentStore } from '@/stores/agent-store'
import { useFileStore } from '@/stores/file-store'
import { useGitStore } from '@/stores/git-store'
import { GitBranch, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GitBranchesProps {
  onSwitch?: () => void
}

export function GitBranches({ onSwitch }: GitBranchesProps) {
  const { send, isConnected } = useWS()
  const { selectedAgentId } = useAgentStore()
  const { rootPath } = useFileStore()
  const { branches } = useGitStore()
  const [isOpen, setIsOpen] = useState(false)

  const currentBranch = branches.find((b) => b.current)

  const handleSwitchBranch = useCallback(
    (branchName: string) => {
      if (!selectedAgentId || !isConnected || !rootPath) return

      send('client:git', {
        agentId: selectedAgentId,
        action: 'checkout',
        workingDirectory: rootPath,
        params: { branch: branchName },
      })

      setIsOpen(false)
      setTimeout(() => onSwitch?.(), 1000)
    },
    [selectedAgentId, isConnected, rootPath, send, onSwitch]
  )

  if (branches.length === 0) {
    return null
  }

  return (
    <div className="p-3">
      <h3 className="font-medium mb-2 flex items-center gap-2">
        <GitBranch className="w-4 h-4" />
        <span>分支</span>
      </h3>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <span>{currentBranch?.name || '选择分支'}</span>
          <ChevronDown
            className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')}
          />
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-48 overflow-auto">
            {branches.map((branch) => (
              <button
                key={branch.name}
                onClick={() => handleSwitchBranch(branch.name)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700',
                  branch.current && 'bg-blue-50 dark:bg-blue-900/20'
                )}
              >
                {branch.current && <Check className="w-4 h-4 text-blue-500" />}
                <span className={cn(!branch.current && 'ml-6')}>
                  {branch.name}
                </span>
                {branch.remote && (
                  <span className="text-xs text-gray-500">({branch.remote})</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

5. **创建 apps/web/src/components/git/git-history.tsx**
```typescript
'use client'

import { useGitStore } from '@/stores/git-store'
import { GitCommit } from 'lucide-react'

export function GitHistory() {
  const { commits } = useGitStore()

  if (commits.length === 0) {
    return null
  }

  return (
    <div className="p-3">
      <h3 className="font-medium mb-2 flex items-center gap-2">
        <GitCommit className="w-4 h-4" />
        <span>提交历史</span>
      </h3>

      <div className="space-y-2 max-h-48 overflow-auto">
        {commits.map((commit) => (
          <div
            key={commit.hash}
            className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs text-blue-500">
                {commit.shortHash}
              </span>
              <span className="text-xs text-gray-500">{commit.date}</span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 truncate">
              {commit.message}
            </p>
            <p className="text-xs text-gray-500">{commit.author}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

### 阶段6：Agent端Git处理

1. **创建 apps/agent/src/handlers/git.ts**
```typescript
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export class GitHandler {
  async status(workingDirectory: string) {
    try {
      const { stdout: branchOutput } = await execAsync('git branch --show-current', {
        cwd: workingDirectory,
      })

      const { stdout: statusOutput } = await execAsync('git status --porcelain', {
        cwd: workingDirectory,
      })

      const { stdout: aheadBehind } = await execAsync(
        'git rev-list --left-right --count HEAD...@{upstream} 2>/dev/null || echo "0\t0"',
        { cwd: workingDirectory }
      )

      const lines = statusOutput.split('\n').filter(Boolean)
      const staged: string[] = []
      const unstaged: string[] = []
      const untracked: string[] = []

      lines.forEach((line) => {
        const status = line.substring(0, 2)
        const file = line.substring(3)

        if (status.startsWith('?')) {
          untracked.push(file)
        } else if (status[0] !== ' ') {
          staged.push(file)
        } else if (status[1] !== ' ') {
          unstaged.push(file)
        }
      })

      const [ahead, behind] = aheadBehind.trim().split('\t').map(Number)

      return {
        status: {
          branch: branchOutput.trim(),
          ahead: ahead || 0,
          behind: behind || 0,
          staged,
          unstaged,
          untracked,
          isClean: lines.length === 0,
        },
      }
    } catch (error: any) {
      throw new Error(`Failed to get git status: ${error.message}`)
    }
  }

  async commit(workingDirectory: string, message: string) {
    try {
      await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
        cwd: workingDirectory,
      })
      return { success: true }
    } catch (error: any) {
      throw new Error(`Failed to commit: ${error.message}`)
    }
  }

  async push(workingDirectory: string, remote = 'origin', branch?: string) {
    try {
      const cmd = branch ? `git push ${remote} ${branch}` : 'git push'
      await execAsync(cmd, { cwd: workingDirectory })
      return { success: true }
    } catch (error: any) {
      throw new Error(`Failed to push: ${error.message}`)
    }
  }

  async pull(workingDirectory: string, remote = 'origin', branch?: string) {
    try {
      const cmd = branch ? `git pull ${remote} ${branch}` : 'git pull'
      await execAsync(cmd, { cwd: workingDirectory })
      return { success: true }
    } catch (error: any) {
      throw new Error(`Failed to pull: ${error.message}`)
    }
  }

  async branches(workingDirectory: string) {
    try {
      const { stdout } = await execAsync('git branch -a', { cwd: workingDirectory })

      const branches = stdout
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const isCurrent = line.startsWith('*')
          const name = line.replace(/^\*?\s+/, '').replace(/^remotes\//, '')
          const isRemote = line.includes('remotes/')

          return {
            name,
            current: isCurrent,
            remote: isRemote ? name.split('/')[0] : undefined,
          }
        })

      return { branches }
    } catch (error: any) {
      throw new Error(`Failed to get branches: ${error.message}`)
    }
  }

  async checkout(workingDirectory: string, branch: string) {
    try {
      await execAsync(`git checkout ${branch}`, { cwd: workingDirectory })
      return { success: true }
    } catch (error: any) {
      throw new Error(`Failed to checkout: ${error.message}`)
    }
  }

  async log(workingDirectory: string, limit = 20) {
    try {
      const { stdout } = await execAsync(
        `git log --oneline --format="%H|%h|%s|%an|%ar" -n ${limit}`,
        { cwd: workingDirectory }
      )

      const commits = stdout
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [hash, shortHash, message, author, date] = line.split('|')
          return { hash, shortHash, message, author, date }
        })

      return { commits }
    } catch (error: any) {
      throw new Error(`Failed to get log: ${error.message}`)
    }
  }

  async diff(workingDirectory: string, staged = false) {
    try {
      const cmd = staged ? 'git diff --staged' : 'git diff'
      const { stdout } = await execAsync(cmd, { cwd: workingDirectory })
      return { diff: stdout }
    } catch (error: any) {
      throw new Error(`Failed to get diff: ${error.message}`)
    }
  }
}
```

---

## 输出要求

1. 终端可以正常使用
2. Git状态正确显示
3. 提交/推送/拉取正常
4. 分支切换正常

## 完成标志

- [ ] 终端状态管理完成
- [ ] xterm终端组件完成
- [ ] Agent终端处理完成
- [ ] Git状态管理完成
- [ ] Git面板组件完成
- [ ] Agent Git处理完成

## 注意事项

1. **xterm.js**需要动态导入（CSR only）
2. **node-pty**需要编译
3. Git命令需要错误处理
4. 终端需要正确清理
