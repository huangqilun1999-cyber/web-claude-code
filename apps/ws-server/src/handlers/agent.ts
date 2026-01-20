import { WebSocket } from 'ws'
import { ConnectionManager } from '../services/connection-manager'
import { createMessage, WS_EVENTS, ERROR_CODES } from '@wcc/shared'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function handleAgentMessage(
  ws: WebSocket,
  message: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const { type, id, payload } = message

  switch (type) {
    case WS_EVENTS.AGENT_AUTH:
      await handleAgentAuth(ws, id, payload, connectionManager)
      break

    case WS_EVENTS.AGENT_THINKING:
      await handleAgentThinking(ws, payload, connectionManager)
      break

    case WS_EVENTS.AGENT_STREAM:
      await handleAgentStream(ws, payload, connectionManager)
      break

    case WS_EVENTS.AGENT_TOOL_CALL:
      await handleAgentToolCall(ws, payload, connectionManager)
      break

    case WS_EVENTS.AGENT_TOOL_RESULT:
      await handleAgentToolResult(ws, payload, connectionManager)
      break

    case WS_EVENTS.AGENT_ABORTED:
      await handleAgentAborted(ws, payload, connectionManager)
      break

    case WS_EVENTS.AGENT_RESPONSE:
      await handleAgentResponse(ws, payload, connectionManager)
      break

    case WS_EVENTS.AGENT_FILE_RESULT:
      await handleAgentFileResult(ws, payload, connectionManager)
      break

    case WS_EVENTS.AGENT_TERMINAL_OUTPUT:
      await handleAgentTerminalOutput(ws, payload, connectionManager)
      break

    case WS_EVENTS.AGENT_GIT_RESULT:
      await handleAgentGitResult(ws, payload, connectionManager)
      break

    case WS_EVENTS.AGENT_INPUT_REQUIRED:
      await handleAgentInputRequired(ws, payload, connectionManager)
      break

    case WS_EVENTS.AGENT_PING:
      ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_PONG, {})))
      break

    default:
      ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_ERROR, {
        code: ERROR_CODES.INVALID_REQUEST,
        message: `Unknown message type: ${type}`,
      })))
  }
}

async function handleAgentAuth(
  ws: WebSocket,
  requestId: string,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const { secretKey, systemInfo } = payload

  // 开发模式：跳过数据库验证
  const DEV_MODE = process.env.NODE_ENV !== 'production' && process.env.DEV_SKIP_AUTH === 'true'

  try {
    if (DEV_MODE) {
      // 开发模式下使用固定的 agentId 和 userId
      const devAgentId = `dev-agent-${secretKey.substring(0, 8)}`
      const devUserId = 'dev-user'

      // 注册Agent连接
      connectionManager.addAgent(ws, devAgentId, devUserId)

      ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_AGENT_AUTH_RESULT, {
        success: true,
        agentId: devAgentId,
      })))

      // 通知用户Agent上线
      connectionManager.sendToUser(devUserId, createMessage(WS_EVENTS.SERVER_AGENT_STATUS, {
        agentId: devAgentId,
        isOnline: true,
        systemInfo,
      }))

      console.log(`[DEV] Agent ${devAgentId} connected (dev mode)`)
      return
    }

    // 验证Agent密钥
    const agent = await prisma.agent.findUnique({
      where: { secretKey },
      include: { user: { select: { id: true } } },
    })

    if (!agent) {
      ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_AGENT_AUTH_RESULT, {
        success: false,
        error: 'Invalid secret key',
      })))
      return
    }

    // 更新Agent状态
    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        isOnline: true,
        lastSeenAt: new Date(),
        systemInfo: systemInfo,
      },
    })

    // 注册Agent连接
    connectionManager.addAgent(ws, agent.id, agent.user.id)

    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_AGENT_AUTH_RESULT, {
      success: true,
      agentId: agent.id,
    })))

    // 通知用户Agent上线
    connectionManager.sendToUser(agent.user.id, createMessage(WS_EVENTS.SERVER_AGENT_STATUS, {
      agentId: agent.id,
      isOnline: true,
      systemInfo,
    }))

    console.log(`Agent ${agent.name} (${agent.id}) connected`)
  } catch (error) {
    console.error('Agent auth error:', error)
    ws.send(JSON.stringify(createMessage(WS_EVENTS.SERVER_AGENT_AUTH_RESULT, {
      success: false,
      error: 'Authentication failed',
    })))
  }
}

async function handleAgentThinking(
  ws: WebSocket,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const agentInfo = connectionManager.getAgentInfo(ws)
  if (!agentInfo) return

  // 转发思考状态给用户
  connectionManager.sendToUser(agentInfo.userId, createMessage(WS_EVENTS.SERVER_THINKING, {
    sessionId: payload.sessionId,
    status: payload.status,
    seq: payload.seq,
  }))
}

async function handleAgentStream(
  ws: WebSocket,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const agentInfo = connectionManager.getAgentInfo(ws)
  if (!agentInfo) return

  // 转发流式输出给用户
  connectionManager.sendToUser(agentInfo.userId, createMessage(WS_EVENTS.SERVER_STREAM, {
    sessionId: payload.sessionId,
    content: payload.content,
    contentType: payload.contentType,
    isPartial: payload.isPartial,
    seq: payload.seq,
  }))
}

async function handleAgentToolCall(
  ws: WebSocket,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const agentInfo = connectionManager.getAgentInfo(ws)
  if (!agentInfo) return

  // 转发工具调用给用户
  connectionManager.sendToUser(agentInfo.userId, createMessage(WS_EVENTS.SERVER_TOOL_CALL, {
    sessionId: payload.sessionId,
    toolName: payload.toolName,
    toolArgs: payload.toolArgs,
    toolUseId: payload.toolUseId,
    content: payload.content,
    seq: payload.seq,
  }))
}

async function handleAgentToolResult(
  ws: WebSocket,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const agentInfo = connectionManager.getAgentInfo(ws)
  if (!agentInfo) return

  // 转发工具执行结果给用户
  connectionManager.sendToUser(agentInfo.userId, createMessage(WS_EVENTS.SERVER_TOOL_RESULT, {
    sessionId: payload.sessionId,
    toolName: payload.toolName,
    toolUseId: payload.toolUseId,
    content: payload.content,
    isError: payload.isError,
    seq: payload.seq,
  }))
}

async function handleAgentAborted(
  ws: WebSocket,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const agentInfo = connectionManager.getAgentInfo(ws)
  if (!agentInfo) return

  // 通知用户任务已中止
  connectionManager.sendToUser(agentInfo.userId, createMessage(WS_EVENTS.SERVER_ABORTED, {
    sessionId: payload.sessionId,
    success: payload.success,
  }))
}

async function handleAgentResponse(
  ws: WebSocket,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const agentInfo = connectionManager.getAgentInfo(ws)
  if (!agentInfo) return

  const { requestId, success, data, error } = payload

  if (success && data?.sessionId && data?.claudeSessionId) {
    // 更新会话的Claude Session ID
    await prisma.session.update({
      where: { id: data.sessionId },
      data: { claudeSessionId: data.claudeSessionId },
    })

    // 保存助手消息
    if (data.content) {
      await prisma.message.create({
        data: {
          sessionId: data.sessionId,
          role: 'ASSISTANT',
          content: data.content,
          metadata: data.usage ? { usage: data.usage } : undefined,
        },
      })
    }
  }

  // 通知用户完成，包含回复内容
  connectionManager.sendToUser(agentInfo.userId, createMessage(WS_EVENTS.SERVER_COMPLETE, {
    sessionId: data?.sessionId,
    claudeSessionId: data?.claudeSessionId,
    content: data?.content,  // 添加回复内容
    usage: data?.usage,
  }))
}

async function handleAgentFileResult(
  ws: WebSocket,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const agentInfo = connectionManager.getAgentInfo(ws)
  if (!agentInfo) {
    console.log('[FileResult] No agent info found')
    return
  }

  console.log('[FileResult] Forwarding to user:', agentInfo.userId, 'payload action:', payload.action)
  connectionManager.sendToUser(agentInfo.userId, createMessage(WS_EVENTS.SERVER_FILE_RESULT, payload))
}

async function handleAgentTerminalOutput(
  ws: WebSocket,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const agentInfo = connectionManager.getAgentInfo(ws)
  if (!agentInfo) return

  connectionManager.sendToUser(agentInfo.userId, createMessage(WS_EVENTS.SERVER_TERMINAL_OUTPUT, payload))
}

async function handleAgentGitResult(
  ws: WebSocket,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const agentInfo = connectionManager.getAgentInfo(ws)
  if (!agentInfo) return

  connectionManager.sendToUser(agentInfo.userId, createMessage(WS_EVENTS.SERVER_GIT_RESULT, payload))
}

async function handleAgentInputRequired(
  ws: WebSocket,
  payload: any,
  connectionManager: ConnectionManager
): Promise<void> {
  const agentInfo = connectionManager.getAgentInfo(ws)
  if (!agentInfo) return

  // 转发用户输入请求给用户
  connectionManager.sendToUser(agentInfo.userId, createMessage(WS_EVENTS.SERVER_INPUT_REQUIRED, {
    sessionId: payload.sessionId,
    requestId: payload.requestId,
    questions: payload.questions,
    seq: payload.seq,
  }))
}
