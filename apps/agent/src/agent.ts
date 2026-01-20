import WebSocket from 'ws'
import os from 'os'
import chalk from 'chalk'
import { AgentConfig, createMessage, WS_EVENTS } from '@wcc/shared'
import { ClaudeExecutor } from './handlers/claude'
import { FileSystemHandler } from './handlers/file-system'
import { TerminalHandler } from './handlers/terminal'
import { GitHandler } from './handlers/git'

export class Agent {
  private ws: WebSocket | null = null
  private config: AgentConfig
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private claudeExecutor: ClaudeExecutor
  private fileSystemHandler: FileSystemHandler
  private terminalHandler: TerminalHandler
  private gitHandler: GitHandler
  private messageSeq: number = 0  // 消息序列号计数器

  constructor(config: AgentConfig) {
    this.config = config
    this.claudeExecutor = new ClaudeExecutor()
    this.fileSystemHandler = new FileSystemHandler(config.allowedPaths)
    this.terminalHandler = new TerminalHandler()
    this.gitHandler = new GitHandler()
  }

  async connect(): Promise<void> {
    const url = `${this.config.serverUrl}?type=agent`

    this.ws = new WebSocket(url)

    this.ws.on('open', () => {
      console.log(chalk.green('Connected to server'))
      this.authenticate()
      this.startHeartbeat()
    })

    this.ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString())
        await this.handleMessage(message)
      } catch (error: any) {
        console.error(chalk.red('Failed to handle message:'), error.message || error)
      }
    })

    this.ws.on('close', () => {
      console.log(chalk.yellow('Disconnected from server'))
      this.stopHeartbeat()
      if (this.config.autoReconnect) {
        this.scheduleReconnect()
      }
    })

    this.ws.on('error', (error) => {
      console.error(chalk.red('WebSocket error:'), error.message)
    })
  }

  private authenticate(): void {
    const systemInfo = {
      os: os.platform(),
      hostname: os.hostname(),
      username: os.userInfo().username,
      homeDir: os.homedir(),
    }

    this.send(createMessage(WS_EVENTS.AGENT_AUTH, {
      secretKey: this.config.secretKey,
      systemInfo,
    }))
  }

  private async handleMessage(message: any): Promise<void> {
    const { type, payload } = message
    console.log(chalk.gray(`[Agent] Received message type: ${type}`))

    switch (type) {
      case WS_EVENTS.SERVER_AGENT_AUTH_RESULT:
        if (payload.success) {
          console.log(chalk.green('Authentication successful'))
        } else {
          console.error(chalk.red('Authentication failed:'), payload.error)
          this.ws?.close()
        }
        break

      case WS_EVENTS.SERVER_EXECUTE:
        await this.handleExecute(payload)
        break

      case WS_EVENTS.SERVER_FILE:
        await this.handleFile(payload)
        break

      case WS_EVENTS.SERVER_TERMINAL:
        await this.handleTerminal(payload)
        break

      case WS_EVENTS.SERVER_GIT:
        await this.handleGit(payload)
        break

      case WS_EVENTS.SERVER_PONG:
        // Heartbeat response
        break

      case WS_EVENTS.SERVER_ABORT:
        await this.handleAbort(payload)
        break

      default:
        console.warn(`Unknown message type: ${type}`)
    }
  }

  private async handleExecute(payload: any): Promise<void> {
    const { requestId, sessionId, prompt, workingDirectory, claudeSessionId, permissionMode, options } = payload

    console.log(chalk.blue(`Executing prompt: ${prompt.substring(0, 50)}...`))
    console.log(chalk.gray(`[Execute] Permission mode: ${permissionMode || 'bypassPermissions'}`))

    // 获取下一个序列号
    const getSeq = () => ++this.messageSeq

    try {
      // 监听思考状态
      this.claudeExecutor.on('thinking', (status) => {
        this.send(createMessage(WS_EVENTS.AGENT_THINKING, {
          requestId,
          sessionId,
          status: status.status,
          seq: getSeq(),
        }))
      })

      // 监听流式输出
      this.claudeExecutor.on('stream', (chunk) => {
        this.send(createMessage(WS_EVENTS.AGENT_STREAM, {
          requestId,
          sessionId,
          content: chunk.content,
          contentType: chunk.type,
          isPartial: true,
          seq: getSeq(),
        }))
      })

      // 监听工具调用
      this.claudeExecutor.on('tool_call', (chunk) => {
        this.send(createMessage(WS_EVENTS.AGENT_TOOL_CALL, {
          requestId,
          sessionId,
          toolName: chunk.toolName,
          toolArgs: chunk.toolArgs,
          content: chunk.content,
          seq: getSeq(),
        }))
      })

      // 监听用户输入请求（AskUserQuestion 工具调用）
      this.claudeExecutor.on('input_required', (data) => {
        console.log(chalk.yellow('[Execute] Input required from user'))
        this.send(createMessage(WS_EVENTS.AGENT_INPUT_REQUIRED, {
          requestId,
          sessionId,
          questions: data.questions,
          toolUseId: data.toolUseId,
          seq: getSeq(),
        }))
      })

      // 监听工具执行结果
      this.claudeExecutor.on('tool_result', (chunk) => {
        this.send(createMessage(WS_EVENTS.AGENT_TOOL_RESULT, {
          requestId,
          sessionId,
          toolName: chunk.toolName,
          toolUseId: chunk.toolUseId,
          content: chunk.content,
          isError: chunk.isError,
          seq: getSeq(),
        }))
      })

      // 不再传递apiKey，使用本地Claude Code已配置的认证
      const result = await this.claudeExecutor.execute({
        prompt,
        workingDirectory,
        sessionId: claudeSessionId,
        permissionMode: permissionMode || 'bypassPermissions',
        maxTurns: options?.maxTurns,
        allowedTools: options?.allowedTools,
      })

      this.send(createMessage(WS_EVENTS.AGENT_RESPONSE, {
        requestId,
        success: true,
        data: {
          sessionId,
          claudeSessionId: result.sessionId,
          content: result.content,
          usage: result.usage,
        },
      }))
    } catch (error: any) {
      console.error(chalk.red('Execute error:'), error.message)
      this.send(createMessage(WS_EVENTS.AGENT_RESPONSE, {
        requestId,
        success: false,
        error: error.message,
      }))
    } finally {
      this.claudeExecutor.removeAllListeners('stream')
      this.claudeExecutor.removeAllListeners('thinking')
      this.claudeExecutor.removeAllListeners('tool_call')
      this.claudeExecutor.removeAllListeners('tool_result')
      this.claudeExecutor.removeAllListeners('input_required')
    }
  }

  private async handleAbort(payload: any): Promise<void> {
    const { requestId, sessionId } = payload

    console.log(chalk.yellow(`[Abort] Aborting task for session: ${sessionId}`))

    const aborted = this.claudeExecutor.abort()

    this.send(createMessage(WS_EVENTS.AGENT_ABORTED, {
      requestId,
      sessionId,
      success: aborted,
    }))
  }

  private async handleFile(payload: any): Promise<void> {
    const { requestId, action, path: rawPath, content, newPath } = payload

    console.log(chalk.blue(`[File] action: ${action}, path: ${rawPath}`))

    try {
      let result: any
      // 解析 ~ 为用户目录
      const path = rawPath === '~' ? (process.env.HOME || process.env.USERPROFILE || '/') : rawPath
      console.log(chalk.gray(`[File] resolved path: ${path}`))

      switch (action) {
        case 'list':
          const files = await this.fileSystemHandler.list(path)
          result = { files, path }  // 返回包含 path 的对象
          break
        case 'read':
          const readResult = await this.fileSystemHandler.read(path)
          const pathModule = await import('path')
          result = {
            ...readResult,
            path,
            name: pathModule.basename(path),
            extension: pathModule.extname(path).slice(1),
          }
          break
        case 'write':
          result = await this.fileSystemHandler.write(path, content)
          break
        case 'delete':
          result = await this.fileSystemHandler.delete(path)
          break
        case 'rename':
          result = await this.fileSystemHandler.rename(path, newPath)
          break
        case 'mkdir':
          result = await this.fileSystemHandler.mkdir(path)
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

  private async handleTerminal(payload: any): Promise<void> {
    const { requestId, action, terminalId, data, cols, rows } = payload

    try {
      let result: any

      switch (action) {
        case 'create':
          // 使用提供的 terminalId 或生成一个新的
          const newTerminalId = terminalId || `term-${Date.now()}`
          result = this.terminalHandler.create(
            newTerminalId,
            cols || 80,
            rows || 24,
            (output) => {
              this.send(createMessage(WS_EVENTS.AGENT_TERMINAL_OUTPUT, {
                requestId,
                terminalId: newTerminalId,
                data: output,
              }))
            }
          )
          break
        case 'input':
          this.terminalHandler.write(terminalId, data)
          break
        case 'resize':
          this.terminalHandler.resize(terminalId, cols, rows)
          break
        case 'close':
          this.terminalHandler.close(terminalId)
          break
      }

      this.send(createMessage(WS_EVENTS.AGENT_RESPONSE, {
        requestId,
        success: true,
        data: result,
      }))
    } catch (error: any) {
      this.send(createMessage(WS_EVENTS.AGENT_RESPONSE, {
        requestId,
        success: false,
        error: error.message,
      }))
    }
  }

  private async handleGit(payload: any): Promise<void> {
    const { requestId, action, workingDirectory, params } = payload

    try {
      let result: any

      switch (action) {
        case 'status':
          result = await this.gitHandler.status(workingDirectory)
          break
        case 'commit':
          result = await this.gitHandler.commit(workingDirectory, params?.message)
          break
        case 'push':
          result = await this.gitHandler.push(workingDirectory, params?.remote, params?.branch)
          break
        case 'pull':
          result = await this.gitHandler.pull(workingDirectory, params?.remote, params?.branch)
          break
        case 'branch':
          result = await this.gitHandler.branches(workingDirectory)
          break
        case 'checkout':
          result = await this.gitHandler.checkout(workingDirectory, params?.branch)
          break
        case 'log':
          result = await this.gitHandler.log(workingDirectory, params?.limit)
          break
        case 'diff':
          result = await this.gitHandler.diff(workingDirectory, params?.staged)
          break
      }

      this.send(createMessage(WS_EVENTS.AGENT_GIT_RESULT, {
        requestId,
        success: true,
        data: result,
      }))
    } catch (error: any) {
      this.send(createMessage(WS_EVENTS.AGENT_GIT_RESULT, {
        requestId,
        success: false,
        error: error.message,
      }))
    }
  }

  private send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send(createMessage(WS_EVENTS.AGENT_PING, {}))
    }, this.config.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return

    console.log(chalk.yellow(`Reconnecting in ${this.config.reconnectInterval / 1000}s...`))
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, this.config.reconnectInterval)
  }

  disconnect(): void {
    this.config.autoReconnect = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.stopHeartbeat()
    this.ws?.close()
  }
}
