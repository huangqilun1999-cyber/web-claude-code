'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'

interface WSMessage {
  id: string
  type: string
  payload: any
  timestamp: number
}

type MessageHandler = (message: WSMessage) => void

export function useWebSocket() {
  const { data: session, status } = useSession()
  const userId = session?.user?.id
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const handlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map())
  const reconnectTimerRef = useRef<NodeJS.Timeout>()
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 10
  const isConnectingRef = useRef(false)
  const hasConnectedOnce = useRef(false)

  const connect = useCallback(async () => {
    // 使用ref检查连接状态，避免闭包问题
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WS] Already connected, skipping')
      return
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('[WS] Already connecting, skipping')
      return
    }

    if (isConnectingRef.current) {
      console.log('[WS] Connection in progress, skipping')
      return
    }

    if (status !== 'authenticated' || !userId) {
      console.log('[WS] No session, skipping connection')
      return
    }

    isConnectingRef.current = true
    setIsConnecting(true)
    console.log('[WS] Starting connection...')

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'
      console.log('[WS] Connecting to:', wsUrl)
      const ws = new WebSocket(`${wsUrl}?type=client`)

      ws.onopen = async () => {
        console.log('[WS] WebSocket connected, authenticating...')

        try {
          // 获取JWT token进行认证
          console.log('[WS] Fetching auth token...')
          const tokenRes = await fetch('/api/auth/token')
          console.log('[WS] Token response status:', tokenRes.status)

          if (!tokenRes.ok) {
            const errorText = await tokenRes.text()
            console.error('[WS] Token fetch failed:', errorText)
            throw new Error('Failed to get auth token')
          }

          const { token } = await tokenRes.json()
          console.log('[WS] Got token, length:', token?.length)

          // 检查WebSocket是否仍然打开
          if (ws.readyState !== WebSocket.OPEN) {
            console.log('[WS] WebSocket closed before auth, aborting')
            return
          }

          ws.send(JSON.stringify({
            id: Date.now().toString(),
            type: 'client:auth',
            payload: { token },
            timestamp: Date.now(),
          }))
          console.log('[WS] Auth message sent')
        } catch (error) {
          console.error('[WS] Auth token fetch failed:', error)
          isConnectingRef.current = false
          setIsConnecting(false)
          ws.close()
        }
      }

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data)
          console.log('[WS] Received message:', message.type)

          // 处理认证结果
          if (message.type === 'server:auth_result') {
            isConnectingRef.current = false
            setIsConnecting(false)

            if (message.payload.success) {
              setIsConnected(true)
              reconnectAttempts.current = 0
              hasConnectedOnce.current = true
              console.log('[WS] ✓ Authenticated successfully')
            } else {
              console.error('[WS] Auth failed:', message.payload.error)
              ws.close()
            }
            return
          }

          // 处理心跳
          if (message.type === 'server:ping') {
            ws.send(JSON.stringify({
              id: Date.now().toString(),
              type: 'client:pong',
              payload: {},
              timestamp: Date.now(),
            }))
            return
          }

          // 分发消息给订阅者
          const handlers = handlersRef.current.get(message.type)
          if (handlers) {
            handlers.forEach((handler) => handler(message))
          }

          // 也分发给通配符订阅者
          const wildcardHandlers = handlersRef.current.get('*')
          if (wildcardHandlers) {
            wildcardHandlers.forEach((handler) => handler(message))
          }
        } catch (error) {
          console.error('[WS] Failed to parse message:', error)
        }
      }

      ws.onclose = (event) => {
        console.log('[WS] Closed:', event.code, event.reason || 'no reason')
        wsRef.current = null
        isConnectingRef.current = false
        setIsConnected(false)
        setIsConnecting(false)

        // 只有在之前成功连接过的情况下才自动重连
        if (hasConnectedOnce.current && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          reconnectAttempts.current++

          console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`)
          reconnectTimerRef.current = setTimeout(() => {
            connect()
          }, delay)
        }
      }

      ws.onerror = (error) => {
        console.error('[WS] Error:', error)
        isConnectingRef.current = false
        setIsConnecting(false)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('[WS] Failed to connect:', error)
      isConnectingRef.current = false
      setIsConnecting(false)
    }
  }, [status, userId])

  const disconnect = useCallback(() => {
    console.log('[WS] Disconnecting...')
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = undefined
    }
    reconnectAttempts.current = maxReconnectAttempts // 防止自动重连
    hasConnectedOnce.current = false
    isConnectingRef.current = false
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
    setIsConnecting(false)
  }, [])

  const send = useCallback((type: string, payload: any): string => {
    console.log('[WS] send called:', type, 'connected:', wsRef.current?.readyState === WebSocket.OPEN)
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('[WS] Cannot send - not connected')
      throw new Error('WebSocket is not connected')
    }

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const message = {
      id,
      type,
      payload,
      timestamp: Date.now(),
    }

    console.log('[WS] Sending message:', JSON.stringify(message))
    wsRef.current.send(JSON.stringify(message))
    return id
  }, [])

  const subscribe = useCallback((type: string, handler: MessageHandler) => {
    if (!handlersRef.current.has(type)) {
      handlersRef.current.set(type, new Set())
    }
    handlersRef.current.get(type)!.add(handler)

    return () => {
      handlersRef.current.get(type)?.delete(handler)
    }
  }, [])

  // 手动重置重连计数
  const resetReconnect = useCallback(() => {
    reconnectAttempts.current = 0
  }, [])

  // 只在认证状态变化时触发连接
  useEffect(() => {
    if (status === 'authenticated' && userId) {
      // 延迟一点点确保组件完全挂载
      const timer = setTimeout(() => {
        connect()
      }, 100)
      return () => {
        clearTimeout(timer)
        disconnect()
      }
    }

    disconnect()
  }, [status, userId, connect, disconnect])

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    send,
    subscribe,
    resetReconnect,
  }
}
