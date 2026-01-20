'use client'

import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import 'xterm/css/xterm.css'
import { useWS } from '@/lib/websocket'
import { useAgentStore } from '@/stores/agent-store'

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

    // 延迟执行 fit，确保容器已经有有效尺寸
    requestAnimationFrame(() => {
      if (containerRef.current && containerRef.current.offsetWidth > 0 && containerRef.current.offsetHeight > 0) {
        try {
          fitAddon.fit()
        } catch (e) {
          console.warn('Terminal fit failed:', e)
        }
      }
    })

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
      if (fitAddonRef.current && isActive && containerRef.current) {
        // 确保容器有有效尺寸再执行 fit
        if (containerRef.current.offsetWidth > 0 && containerRef.current.offsetHeight > 0) {
          try {
            fitAddonRef.current.fit()
          } catch (e) {
            console.warn('Terminal fit failed on resize:', e)
          }
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isActive])

  // 激活时重新fit
  useEffect(() => {
    if (isActive && fitAddonRef.current && containerRef.current) {
      setTimeout(() => {
        if (containerRef.current && containerRef.current.offsetWidth > 0 && containerRef.current.offsetHeight > 0) {
          try {
            fitAddonRef.current?.fit()
          } catch (e) {
            console.warn('Terminal fit failed on activate:', e)
          }
        }
      }, 0)
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
