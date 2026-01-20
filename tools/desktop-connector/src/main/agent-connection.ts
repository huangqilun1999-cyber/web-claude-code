import WebSocket from 'ws'
import { EventEmitter } from 'events'
import os from 'os'
import { spawn, ChildProcess } from 'child_process'

interface Message {
  type: string
  id: string
  payload: any
}

interface Agent {
  id: string
  name: string
  description: string | null
  secretKey: string
  isOnline: boolean
}

// WebSocket 事件常量
const WS_EVENTS = {
  // Agent -> Server
  AGENT_AUTH: 'agent:auth',
  AGENT_PING: 'agent:ping',
  AGENT_RESPONSE: 'agent:response',
  AGENT_STREAM: 'agent:stream',
  AGENT_THINKING: 'agent:thinking',
  AGENT_TOOL_CALL: 'agent:tool_call',
  AGENT_FILE_RESULT: 'agent:file_result',
  AGENT_INPUT_REQUIRED: 'agent:input_required',

  // Server -> Agent
  SERVER_AGENT_AUTH_RESULT: 'server:agent_auth_result',
  SERVER_PONG: 'server:pong',
  SERVER_EXECUTE: 'server:execute',
  SERVER_FILE: 'server:file',
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function createMessage(type: string, payload: any): Message {
  return { type, id: generateId(), payload }
}

export class AgentConnection extends EventEmitter {
  private ws: WebSocket | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private connected = false
  private authenticated = false
  private agentId: string | null = null
  private secretKey: string | null = null
  private claudeProcess: ChildProcess | null = null
  private wsServerUrl: string | null = null

  constructor() {
    super()
  }

  // 登录到 Web UI 并获取 Agent 列表
  async login(serverUrl: string, email: string, password: string): Promise<{
    success: boolean
    agents?: Agent[]
    wsServerUrl?: string
    error?: string
  }> {
    try {
      // 确保是 HTTP URL
      const httpUrl = serverUrl.replace(/^ws/, 'http')

      console.log('[AgentConnection] Logging in to:', httpUrl)

      // 辅助函数：从 set-cookie 提取 cookie 名值对
      const parseCookies = (setCookieHeaders: string[]): string => {
        return setCookieHeaders
          .map(cookie => cookie.split(';')[0]) // 只取 name=value 部分
          .join('; ')
      }

      // 1. 获取 CSRF token 和 cookie
      const csrfResponse = await fetch(`${httpUrl}/api/auth/csrf`)
      if (!csrfResponse.ok) {
        return { success: false, error: '无法获取 CSRF token，请检查服务器地址' }
      }
      const csrfData = await csrfResponse.json()
      const csrfToken = csrfData.csrfToken

      // 使用 getSetCookie() 获取所有 cookies
      const csrfCookies = (csrfResponse.headers as any).getSetCookie?.() ||
        [csrfResponse.headers.get('set-cookie')].filter(Boolean)
      const csrfCookieStr = parseCookies(csrfCookies)

      console.log('[AgentConnection] Got CSRF token, cookies:', csrfCookies.length)

      // 2. 登录 - 需要发送 CSRF cookie
      const loginResponse = await fetch(`${httpUrl}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': csrfCookieStr,
        },
        body: new URLSearchParams({
          csrfToken,
          email,
          password,
          json: 'true',
        }),
        redirect: 'manual',
      })

      console.log('[AgentConnection] Login response status:', loginResponse.status)

      // 检查重定向 location
      const location = loginResponse.headers.get('location')
      console.log('[AgentConnection] Login redirect location:', location)

      // 获取所有 set-cookie headers
      const loginCookies = (loginResponse.headers as any).getSetCookie?.() ||
        [loginResponse.headers.get('set-cookie')].filter(Boolean)
      console.log('[AgentConnection] Login cookies count:', loginCookies.length)

      // 合并所有 cookies
      const allCookies = parseCookies([...csrfCookies, ...loginCookies])
      console.log('[AgentConnection] All cookies:', allCookies)

      if (location?.includes('error')) {
        return { success: false, error: '登录失败，请检查账号密码' }
      }

      // 3. 获取 session 验证登录成功
      const sessionResponse = await fetch(`${httpUrl}/api/auth/session`, {
        headers: {
          'Cookie': allCookies,
        },
      })

      const session = await sessionResponse.json()
      console.log('[AgentConnection] Session:', JSON.stringify(session))

      if (!session?.user) {
        return { success: false, error: '登录失败，请检查账号密码' }
      }

      // 4. 获取 Agent 列表
      const agentsResponse = await fetch(`${httpUrl}/api/agents`, {
        headers: {
          'Cookie': allCookies,
        },
      })

      console.log('[AgentConnection] Agents response status:', agentsResponse.status)

      if (!agentsResponse.ok) {
        const errorText = await agentsResponse.text()
        console.log('[AgentConnection] Agents error:', errorText)
        return { success: false, error: '获取 Agent 列表失败' }
      }

      const agentsData = await agentsResponse.json()
      // API 返回 { agents: [...] } 格式
      const agents: Agent[] = agentsData.agents || agentsData || []
      console.log('[AgentConnection] Got agents:', agents.length)

      // 计算 WebSocket 服务器地址 (假设 WS 端口是 8080)
      const url = new URL(httpUrl)
      const wsServerUrl = `ws://${url.hostname}:8080`

      return {
        success: true,
        agents,
        wsServerUrl,
      }
    } catch (error: any) {
      console.error('[AgentConnection] Login error:', error)
      return { success: false, error: `连接失败: ${error.message}` }
    }
  }

  // 使用 Agent 密钥连接到 WebSocket 服务器
  async connectAgent(wsServerUrl: string, secretKey: string, agentId: string): Promise<{
    success: boolean
    error?: string
  }> {
    return new Promise((resolve) => {
      try {
        this.wsServerUrl = wsServerUrl
        this.secretKey = secretKey
        this.agentId = agentId

        const wsUrl = `${wsServerUrl}?type=agent`
        console.log('[AgentConnection] Connecting to:', wsUrl)

        this.ws = new WebSocket(wsUrl)

        this.ws.on('open', () => {
          console.log('[AgentConnection] WebSocket connected')
          this.connected = true
          this.emit('connected')
          this.authenticate()
          this.startHeartbeat()
          resolve({ success: true })
        })

        this.ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString())
            this.handleMessage(message)
          } catch (error) {
            console.error('[AgentConnection] Failed to parse message:', error)
          }
        })

        this.ws.on('close', () => {
          console.log('[AgentConnection] WebSocket disconnected')
          this.connected = false
          this.authenticated = false
          this.stopHeartbeat()
          this.emit('disconnected')
        })

        this.ws.on('error', (error) => {
          console.error('[AgentConnection] WebSocket error:', error)
          this.emit('error', error.message)
          resolve({ success: false, error: error.message })
        })

        // 设置连接超时
        setTimeout(() => {
          if (!this.connected) {
            this.ws?.close()
            resolve({ success: false, error: '连接超时' })
          }
        }, 10000)
      } catch (error: any) {
        resolve({ success: false, error: error.message })
      }
    })
  }

  private authenticate(): void {
    if (!this.secretKey) return

    const systemInfo = {
      os: os.platform(),
      hostname: os.hostname(),
      username: os.userInfo().username,
      homeDir: os.homedir(),
    }

    console.log('[AgentConnection] Authenticating with secretKey')
    this.send(createMessage(WS_EVENTS.AGENT_AUTH, {
      secretKey: this.secretKey,
      systemInfo,
    }))
  }

  private handleMessage(message: Message): void {
    const { type, payload } = message
    console.log('[AgentConnection] Received message:', type)

    switch (type) {
      case WS_EVENTS.SERVER_AGENT_AUTH_RESULT:
        if (payload.success) {
          this.authenticated = true
          this.agentId = payload.agentId
          console.log('[AgentConnection] Authentication successful')
          this.emit('auth-result', { success: true, agentId: payload.agentId })
        } else {
          this.authenticated = false
          console.log('[AgentConnection] Authentication failed:', payload.error)
          this.emit('auth-result', { success: false, error: payload.error })
          this.disconnect()
        }
        break

      case WS_EVENTS.SERVER_PONG:
        // 心跳响应
        break

      case WS_EVENTS.SERVER_EXECUTE:
        this.handleExecute(payload)
        break

      case WS_EVENTS.SERVER_FILE:
        this.handleFile(payload)
        break
    }
  }

  private async handleExecute(payload: any): Promise<void> {
    const { requestId, sessionId, prompt, workingDirectory, claudeSessionId, permissionMode } = payload

    try {
      // 构建 Claude Code 命令参数
      const args = ['-p', '--output-format', 'stream-json', '--verbose']

      // 处理权限模式
      switch (permissionMode) {
        case 'plan':
          args.push('--plan')
          break
        case 'bypassPermissions':
          args.push('--permission-mode', 'bypassPermissions')
          break
        case 'askEdits':
          args.push('--permission-mode', 'default')
          break
        case 'autoEdits':
          args.push('--permission-mode', 'autoEditFiles')
          break
        default:
          args.push('--permission-mode', 'bypassPermissions')
      }

      if (claudeSessionId) {
        args.push('--resume', claudeSessionId)
      }

      args.push(prompt)

      // 启动 Claude Code 进程
      this.claudeProcess = spawn('claude', args, {
        cwd: workingDirectory || os.homedir(),
        shell: true,
        env: { ...process.env },
      })

      let outputBuffer = ''
      let resultSessionId = claudeSessionId

      this.claudeProcess.stdout?.on('data', (data) => {
        outputBuffer += data.toString()

        // 解析 stream-json 输出
        const lines = outputBuffer.split('\n')
        outputBuffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const json = JSON.parse(line)

            if (json.type === 'system' && json.subtype === 'init') {
              resultSessionId = json.session_id
            } else if (json.type === 'assistant' && json.message) {
              // 发送流式输出
              if (json.message.content) {
                for (const content of json.message.content) {
                  if (content.type === 'text') {
                    this.send(createMessage(WS_EVENTS.AGENT_STREAM, {
                      requestId,
                      sessionId,
                      content: content.text,
                      contentType: 'text',
                      isPartial: true,
                    }))
                  } else if (content.type === 'tool_use') {
                    this.send(createMessage(WS_EVENTS.AGENT_TOOL_CALL, {
                      requestId,
                      sessionId,
                      toolName: content.name,
                      toolArgs: content.input,
                    }))

                    // 检测 AskUserQuestion
                    if (content.name === 'AskUserQuestion') {
                      this.send(createMessage(WS_EVENTS.AGENT_INPUT_REQUIRED, {
                        requestId,
                        sessionId,
                        questions: content.input?.questions || [],
                        toolUseId: content.id,
                      }))
                    }
                  }
                }
              }
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      })

      this.claudeProcess.stderr?.on('data', (data) => {
        console.error('Claude stderr:', data.toString())
      })

      this.claudeProcess.on('close', (code) => {
        this.send(createMessage(WS_EVENTS.AGENT_RESPONSE, {
          requestId,
          success: code === 0,
          data: {
            sessionId,
            claudeSessionId: resultSessionId,
            content: '',
          },
        }))
        this.claudeProcess = null
      })

      this.claudeProcess.on('error', (error) => {
        this.send(createMessage(WS_EVENTS.AGENT_RESPONSE, {
          requestId,
          success: false,
          error: error.message,
        }))
        this.claudeProcess = null
      })
    } catch (error: any) {
      this.send(createMessage(WS_EVENTS.AGENT_RESPONSE, {
        requestId,
        success: false,
        error: error.message,
      }))
    }
  }

  private async handleFile(payload: any): Promise<void> {
    const { requestId, action, path } = payload
    const fs = await import('fs/promises')
    const pathModule = await import('path')

    try {
      let result: any

      const resolvedPath = path === '~'
        ? os.homedir()
        : path.startsWith('~/')
          ? pathModule.join(os.homedir(), path.slice(2))
          : path

      switch (action) {
        case 'list':
          const entries = await fs.readdir(resolvedPath, { withFileTypes: true })
          result = {
            files: entries.map(entry => ({
              name: entry.name,
              isDirectory: entry.isDirectory(),
              isFile: entry.isFile(),
            })),
            path: resolvedPath,
          }
          break

        case 'read':
          const content = await fs.readFile(resolvedPath, 'utf-8')
          result = content
          break

        case 'write':
          await fs.writeFile(resolvedPath, payload.content, 'utf-8')
          result = { success: true }
          break
      }

      this.send(createMessage(WS_EVENTS.AGENT_FILE_RESULT, {
        requestId,
        action,
        success: true,
        data: result,
      }))
    } catch (error: any) {
      this.send(createMessage(WS_EVENTS.AGENT_FILE_RESULT, {
        requestId,
        action,
        success: false,
        error: error.message,
      }))
    }
  }

  private send(message: Message): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send(createMessage(WS_EVENTS.AGENT_PING, {}))
    }, 30000)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  disconnect(): void {
    this.stopHeartbeat()
    if (this.claudeProcess) {
      this.claudeProcess.kill()
      this.claudeProcess = null
    }
    this.ws?.close()
    this.ws = null
    this.connected = false
    this.authenticated = false
  }

  isConnected(): boolean {
    return this.connected
  }

  isAuthenticated(): boolean {
    return this.authenticated
  }
}
