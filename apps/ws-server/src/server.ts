import { createServer as createHttpServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { PrismaClient } from '@prisma/client'
import { ConnectionManager } from './services/connection-manager'
import { handleClientMessage } from './handlers/client'
import { handleAgentMessage } from './handlers/agent'

const prisma = new PrismaClient()

export function createServer() {
  const httpServer = createHttpServer()
  const wss = new WebSocketServer({ server: httpServer })
  const connectionManager = new ConnectionManager()

  // 设置 Agent 断开回调，更新数据库状态
  connectionManager.setOnAgentDisconnect(async (agentId) => {
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        isOnline: false,
        lastSeenAt: new Date(),
      },
    })
    console.log(`Agent ${agentId} marked as offline in database`)
  })

  wss.on('connection', (ws: WebSocket, request) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`)
    const connectionType = url.searchParams.get('type') || 'client'

    console.log(`New ${connectionType} connection`)

    // 设置连接超时（30秒内必须认证）
    const authTimeout = setTimeout(() => {
      if (!connectionManager.isAuthenticated(ws)) {
        ws.close(4001, 'Authentication timeout')
      }
    }, 30000)

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString())
        console.log(`[Server] Received ${connectionType} message:`, message.type)

        if (connectionType === 'agent') {
          await handleAgentMessage(ws, message, connectionManager)
        } else {
          await handleClientMessage(ws, message, connectionManager)
        }

        // 认证成功后清除超时
        if (connectionManager.isAuthenticated(ws)) {
          clearTimeout(authTimeout)
        }
      } catch (error) {
        console.error('Message handling error:', error)
        ws.send(JSON.stringify({
          id: Date.now().toString(),
          type: 'server:error',
          payload: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to process message',
          },
          timestamp: Date.now(),
        }))
      }
    })

    ws.on('close', (code, reason) => {
      clearTimeout(authTimeout)
      connectionManager.removeConnection(ws)
      console.log(`${connectionType} disconnected, code: ${code}, reason: ${reason?.toString() || 'none'}`)
    })

    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
      clearTimeout(authTimeout)
      connectionManager.removeConnection(ws)
    })

    // 心跳检测
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping()
      }
    }, 30000)

    ws.on('close', () => clearInterval(pingInterval))
  })

  return httpServer
}
