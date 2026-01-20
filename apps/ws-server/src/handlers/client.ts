import { WebSocket } from 'ws'
import { ConnectionManager } from '../services/connection-manager'
import { verifyToken } from '../utils/jwt'
import { createMessage, WS_EVENTS, ERROR_CODES } from '@wcc/shared'
import { PrismaClient } from '@prisma/client'
import { decrypt } from '../utils/crypto'

const prisma = new PrismaClient()

export async function handleClientMessage(
  ws: WebSocket,
  message: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const { type, id, payload } = message
  console.log(`[Client] Received message type: ${type}`)

  switch (type) {
    case WS_EVENTS.CLIENT_AUTH:
      await handleAuth(ws, id, payload, connectionManager)
      break

    case WS_EVENTS.CLIENT_EXECUTE:
      await handleExecute(ws, id, payload, connectionManager)
      break

    case WS_EVENTS.CLIENT_FILE:
      await handleFile(ws, id, payload, connectionManager)
      break

    case WS_EVENTS.CLIENT_TERMINAL:
      await handleTerminal(ws, id, payload, connectionManager)
      break

    case WS_EVENTS.CLIENT_GIT:
      await handleGit(ws, id, payload, connectionManager)
      break

    case WS_EVENTS.CLIENT_INPUT_RESPONSE:
      await handleInputResponse(ws, id, payload, connectionManager)
      break

    case WS_EVENTS.CLIENT_ABORT:
      await handleAbort(ws, id, payload, connectionManager)
      break

    case WS_EVENTS.CLIENT_PING:
      ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_PONG, {})))
      break

    default:
      ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
        code: ERROR_CODES.INVALID_REQUEST,
        message: `Unknown message type: ${type}`,
      })))
  }
}

async function handleAuth(
  ws: WebSocket,
  requestId: string,
  payload: { token: string },
  connectionManager: ConnectionManager
): Promise<void> {
  console.log('[Client] handleAuth called, token length:', payload?.token?.length || 0)
  try {
    const decoded = await verifyToken(payload.token)
    console.log('[Client] Token verified successfully:', decoded.email)
    connectionManager.addClient(ws, decoded.id)

    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_AUTH_RESULT, {
      success: true,
      userId: decoded.id,
    })))

    console.log(`Client authenticated: ${decoded.email} (${decoded.id})`)

    // 认证成功后，发送该用户的Agent列表
    await sendAgentListToClient(ws, decoded.id)
  } catch (error) {
    console.error('Client auth error:', error)
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_AUTH_RESULT, {
      success: false,
      error: 'Invalid token',
    })))
  }
}

// 发送Agent列表给客户端
async function sendAgentListToClient(ws: WebSocket, userId: string): Promise<void> {
  try {
    const agents = await prisma.agent.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        isOnline: true,
        lastSeenAt: true,
      },
    })

    console.log(`[Client] Sending ${agents.length} agents to user ${userId}`)

    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_AGENT_LIST, {
      agents: agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        type: agent.type,
        isOnline: agent.isOnline,
        lastSeenAt: agent.lastSeenAt?.toISOString(),
      })),
    })))
  } catch (error) {
    console.error('[Client] Failed to send agent list:', error)
  }
}

async function handleExecute(
  ws: WebSocket,
  requestId: string,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  console.log('[Execute] Received execute request:', JSON.stringify(payload, null, 2))

  const userId = connectionManager.getClientUserId(ws)
  if (!userId) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
      code: ERROR_CODES.AUTH_REQUIRED,
      message: 'Authentication required',
    })))
    return
  }

  const { agentId, sessionId, prompt, workingDirectory, permissionMode, options } = payload
  console.log('[Execute] agentId:', agentId, 'isOnline:', connectionManager.isAgentOnline(agentId))

  // 检查Agent是否在线
  if (!connectionManager.isAgentOnline(agentId)) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
      code: ERROR_CODES.AGENT_OFFLINE,
      message: 'Agent is offline',
    })))
    return
  }

  // 注意：不再需要检查用户的API Key
  // Agent会使用本地已配置的Claude Code认证

  // 保存前端的原始sessionId，用于后续消息匹配
  const frontendSessionId = sessionId

  // 获取或创建会话
  let session = sessionId
    ? await prisma.session.findUnique({ where: { id: sessionId } })
    : null

  if (!session) {
    session = await prisma.session.create({
      data: {
        userId,
        agentId,
        name: `会话 ${new Date().toLocaleString()}`,
        workingDirectory,
      },
    })

    // 通知前端新的数据库sessionId，让前端更新本地状态
    console.log('[Execute] Created new session, notifying client:', {
      frontendSessionId,
      dbSessionId: session.id,
    })
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_SESSION_CREATED, {
      frontendSessionId,
      sessionId: session.id,
      name: session.name,
      workingDirectory: session.workingDirectory,
    })))
  }

  // 保存用户消息
  await prisma.message.create({
    data: {
      sessionId: session.id,
      role: 'USER',
      content: prompt,
    },
  })

  // 发送给Agent执行（Agent使用本地Claude Code配置的认证）
  console.log('[Execute] Sending to agent with permissionMode:', permissionMode)
  const sent = connectionManager.sendToAgent(agentId, createMessage(WS_EVENTS.SERVER_EXECUTE, {
    requestId,
    sessionId: session.id,
    prompt,
    workingDirectory: workingDirectory || session.workingDirectory,
    claudeSessionId: session.claudeSessionId,
    permissionMode: permissionMode || 'bypassPermissions',
    options,
  }))

  if (!sent) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
      code: ERROR_CODES.AGENT_OFFLINE,
      message: 'Failed to send to agent',
    })))
  }
}

async function handleFile(
  ws: WebSocket,
  requestId: string,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const userId = connectionManager.getClientUserId(ws)
  if (!userId) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
      code: ERROR_CODES.AUTH_REQUIRED,
      message: 'Authentication required',
    })))
    return
  }

  const { agentId, ...filePayload } = payload

  if (!connectionManager.isAgentOnline(agentId)) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
      code: ERROR_CODES.AGENT_OFFLINE,
      message: 'Agent is offline',
    })))
    return
  }

  connectionManager.sendToAgent(agentId, createMessage(WS_EVENTS.SERVER_FILE, {
    requestId,
    ...filePayload,
  }))
}

async function handleTerminal(
  ws: WebSocket,
  requestId: string,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const userId = connectionManager.getClientUserId(ws)
  if (!userId) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
      code: ERROR_CODES.AUTH_REQUIRED,
      message: 'Authentication required',
    })))
    return
  }

  const { agentId, ...terminalPayload } = payload

  if (!connectionManager.isAgentOnline(agentId)) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
      code: ERROR_CODES.AGENT_OFFLINE,
      message: 'Agent is offline',
    })))
    return
  }

  connectionManager.sendToAgent(agentId, createMessage(WS_EVENTS.SERVER_TERMINAL, {
    requestId,
    ...terminalPayload,
  }))
}

async function handleGit(
  ws: WebSocket,
  requestId: string,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const userId = connectionManager.getClientUserId(ws)
  if (!userId) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
      code: ERROR_CODES.AUTH_REQUIRED,
      message: 'Authentication required',
    })))
    return
  }

  const { agentId, ...gitPayload } = payload

  if (!connectionManager.isAgentOnline(agentId)) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
      code: ERROR_CODES.AGENT_OFFLINE,
      message: 'Agent is offline',
    })))
    return
  }

  connectionManager.sendToAgent(agentId, createMessage(WS_EVENTS.SERVER_GIT, {
    requestId,
    ...gitPayload,
  }))
}

async function handleInputResponse(
  ws: WebSocket,
  requestId: string,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const userId = connectionManager.getClientUserId(ws)
  if (!userId) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
      code: ERROR_CODES.AUTH_REQUIRED,
      message: 'Authentication required',
    })))
    return
  }

  const { agentId, ...inputPayload } = payload

  if (!connectionManager.isAgentOnline(agentId)) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
      code: ERROR_CODES.AGENT_OFFLINE,
      message: 'Agent is offline',
    })))
    return
  }

  // 转发用户输入响应给 Agent
  connectionManager.sendToAgent(agentId, createMessage(WS_EVENTS.SERVER_INPUT_RESPONSE, {
    requestId,
    ...inputPayload,
  }))
}

async function handleAbort(
  ws: WebSocket,
  requestId: string,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const userId = connectionManager.getClientUserId(ws)
  if (!userId) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
      code: ERROR_CODES.AUTH_REQUIRED,
      message: 'Authentication required',
    })))
    return
  }

  const { agentId, sessionId } = payload
  console.log('[Abort] Received abort request for session:', sessionId)

  if (!connectionManager.isAgentOnline(agentId)) {
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
      code: ERROR_CODES.AGENT_OFFLINE,
      message: 'Agent is offline',
    })))
    return
  }

  // 转发中止请求给 Agent
  connectionManager.sendToAgent(agentId, createMessage(WS_EVENTS.SERVER_ABORT, {
    requestId,
    sessionId,
  }))
}
