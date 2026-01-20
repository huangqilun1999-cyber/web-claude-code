'use client'

import { useCallback, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { OnMount, OnChange } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useFileStore, useActiveFile } from '@/stores/file-store'
import { useWS } from '@/lib/websocket'
import { useAgentStore } from '@/stores/agent-store'
import { EditorTabs } from './editor-tabs'
import { EditorToolbar } from './editor-toolbar'
import { Loader2 } from 'lucide-react'

// 动态导入 Monaco Editor 以避免 SSR 问题
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-900">
      <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
    </div>
  ),
})

interface CodeEditorProps {
  className?: string
}

export function CodeEditor({ className }: CodeEditorProps) {
  const { send, isConnected } = useWS()
  const { selectedAgentId } = useAgentStore()
  const { updateFileContent, markFileSaved } = useFileStore()
  const activeFile = useActiveFile()
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null)
  // 使用 ref 保存最新的保存函数引用，避免闭包问题
  const saveHandlerRef = useRef<() => void>(() => {})

  const handleSave = useCallback(() => {
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

  // 保持 saveHandlerRef 始终指向最新的 handleSave
  useEffect(() => {
    saveHandlerRef.current = handleSave
  }, [handleSave])

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // 添加保存快捷键 Ctrl+S / Cmd+S
    // 使用 ref 调用以避免闭包捕获旧值
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveHandlerRef.current()
    })

    // 添加格式化快捷键 Shift+Alt+F
    editor.addCommand(
      monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
      () => {
        editor.getAction('editor.action.formatDocument')?.run()
      }
    )
  }

  const handleChange: OnChange = (value) => {
    if (activeFile && value !== undefined) {
      updateFileContent(activeFile.path, value)
    }
  }

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
    <div className={`flex flex-col h-full ${className || ''}`}>
      <EditorTabs />
      <EditorToolbar onSave={handleSave} />
      <div className="flex-1 min-h-0">
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
            renderWhitespace: 'selection',
            bracketPairColorization: {
              enabled: true,
            },
            scrollbar: {
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
            padding: {
              top: 10,
            },
          }}
        />
      </div>
    </div>
  )
}
