'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useWebSocket } from '@/hooks/use-websocket'

type WebSocketContextType = ReturnType<typeof useWebSocket>

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const ws = useWebSocket()

  return (
    <WebSocketContext.Provider value={ws}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWS() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWS must be used within a WebSocketProvider')
  }
  return context
}

// Optional: Hook for checking connection without throwing
export function useWSOptional() {
  return useContext(WebSocketContext)
}
