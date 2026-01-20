import { WebSocket } from 'ws'
import { createMessage, WS_EVENTS } from '@wcc/shared'

interface ClientConnection {
  ws: WebSocket
  userId: string
  authenticatedAt: Date
}

interface AgentConnection {
  ws: WebSocket
  agentId: string
  userId: string
  authenticatedAt: Date
}

type AgentDisconnectCallback = (agentId: string) => Promise<void>

export class ConnectionManager {
  private clients = new Map<WebSocket, ClientConnection>()
  private agents = new Map<WebSocket, AgentConnection>()
  private agentById = new Map<string, WebSocket>()
  private userClients = new Map<string, Set<WebSocket>>()
  private onAgentDisconnect?: AgentDisconnectCallback

  setOnAgentDisconnect(callback: AgentDisconnectCallback): void {
    this.onAgentDisconnect = callback
  }

  // 客户端管理
  addClient(ws: WebSocket, userId: string): void {
    this.clients.set(ws, {
      ws,
      userId,
      authenticatedAt: new Date(),
    })

    if (!this.userClients.has(userId)) {
      this.userClients.set(userId, new Set())
    }
    this.userClients.get(userId)!.add(ws)
  }

  getClientUserId(ws: WebSocket): string | undefined {
    return this.clients.get(ws)?.userId
  }

  // Agent管理
  addAgent(ws: WebSocket, agentId: string, userId: string): void {
    this.agents.set(ws, {
      ws,
      agentId,
      userId,
      authenticatedAt: new Date(),
    })
    this.agentById.set(agentId, ws)
  }

  getAgent(agentId: string): WebSocket | undefined {
    return this.agentById.get(agentId)
  }

  getAgentInfo(ws: WebSocket): AgentConnection | undefined {
    return this.agents.get(ws)
  }

  isAgentOnline(agentId: string): boolean {
    const ws = this.agentById.get(agentId)
    return ws !== undefined && ws.readyState === WebSocket.OPEN
  }

  // 通用
  isAuthenticated(ws: WebSocket): boolean {
    return this.clients.has(ws) || this.agents.has(ws)
  }

  removeConnection(ws: WebSocket): void {
    // 移除客户端
    const client = this.clients.get(ws)
    if (client) {
      this.clients.delete(ws)
      const userSockets = this.userClients.get(client.userId)
      if (userSockets) {
        userSockets.delete(ws)
        if (userSockets.size === 0) {
          this.userClients.delete(client.userId)
        }
      }
    }

    // 移除Agent
    const agent = this.agents.get(ws)
    if (agent) {
      this.agents.delete(ws)
      this.agentById.delete(agent.agentId)

      // 通知相关用户Agent离线
      this.notifyAgentStatus(agent.agentId, agent.userId, false)

      // 触发断开回调（更新数据库状态）
      if (this.onAgentDisconnect) {
        this.onAgentDisconnect(agent.agentId).catch((err) => {
          console.error('Failed to handle agent disconnect:', err)
        })
      }
    }
  }

  // 发送消息给用户的所有客户端
  sendToUser(userId: string, message: any): void {
    const sockets = this.userClients.get(userId)
    if (sockets) {
      const messageStr = JSON.stringify(message)
      sockets.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr)
        }
      })
    }
  }

  // 发送消息给Agent
  sendToAgent(agentId: string, message: any): boolean {
    const ws = this.agentById.get(agentId)
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
      return true
    }
    return false
  }

  // 通知Agent状态变化
  private notifyAgentStatus(agentId: string, userId: string, isOnline: boolean): void {
    const message = createMessage(WS_EVENTS.SERVER_AGENT_STATUS, {
      agentId,
      isOnline,
    })
    this.sendToUser(userId, message)
  }
}
