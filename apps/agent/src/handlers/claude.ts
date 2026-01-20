import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'

type PermissionMode = 'plan' | 'bypassPermissions' | 'askEdits' | 'autoEdits'

interface ClaudeOptions {
  prompt: string
  workingDirectory: string
  sessionId?: string
  permissionMode?: PermissionMode
  maxTurns?: number
  allowedTools?: string[]
}

interface StreamChunk {
  type: 'text' | 'code' | 'tool_use' | 'tool_result' | 'thinking'
  content: string
  toolName?: string
  toolArgs?: Record<string, any>
  toolUseId?: string
  isError?: boolean
}

interface ExecuteResult {
  sessionId: string
  content: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

export class ClaudeExecutor extends EventEmitter {
  private process: ChildProcess | null = null
  private isAborted: boolean = false

  async execute(options: ClaudeOptions): Promise<ExecuteResult> {
    this.isAborted = false

    return new Promise((resolve, reject) => {
      // 构建命令参数
      const args = this.buildArgs(options)

      console.log('[Claude] Executing claude command via Git Bash')
      console.log('[Claude] Args:', args.join(' '))
      console.log('[Claude] Prompt:', options.prompt.substring(0, 100))
      console.log('[Claude] Working directory:', options.workingDirectory)

      // 使用 Git Bash 执行 claude 命令，通过 stdin 传递 prompt 避免编码问题
      const gitBashPath = process.env.CLAUDE_CODE_GIT_BASH_PATH || 'D:\\git\\Git\\bin\\bash.exe'
      // 使用 echo 通过管道传递 prompt
      const escapedPrompt = options.prompt.replace(/'/g, "'\\''")
      const bashCommand = `echo '${escapedPrompt}' | claude ${args.join(' ')}`

      console.log('[Claude] Bash command:', bashCommand.substring(0, 200))

      this.process = spawn(gitBashPath, ['-c', bashCommand], {
        cwd: options.workingDirectory || process.cwd(),
        env: {
          ...process.env,
          CLAUDE_CODE_GIT_BASH_PATH: 'D:\\git\\Git\\bin\\bash.exe',
        },
        windowsHide: true,
      })

      console.log('[Claude] Process started, PID:', this.process.pid)

      let stdout = ''
      let stderr = ''
      let sessionId = options.sessionId || ''
      let responseContent = ''
      let hasEmittedThinking = false
      // 用于跟踪工具调用
      const pendingToolCalls = new Map<string, { name: string; args: any }>()

      this.process.stdout?.on('data', (data) => {
        const chunk = data.toString()
        stdout += chunk
        console.log('[Claude] stdout chunk:', chunk.substring(0, 200))

        // 尝试解析stream-json格式
        const lines = chunk.split('\n').filter((line: string) => line.trim())
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line)

            // 处理系统初始化消息 - 表示开始思考
            if (parsed.type === 'system' && parsed.subtype === 'init') {
              if (parsed.session_id) {
                sessionId = parsed.session_id
              }
              if (!hasEmittedThinking) {
                hasEmittedThinking = true
                this.emit('thinking', { status: 'start' })
              }
            }

            // 处理 assistant 消息
            if (parsed.type === 'assistant' && parsed.message?.content) {
              // 收到 assistant 消息说明思考结束，开始输出
              this.emit('thinking', { status: 'end' })

              for (const content of parsed.message.content) {
                if (content.type === 'text') {
                  responseContent += content.text
                  this.emit('stream', {
                    type: 'text',
                    content: content.text,
                  } as StreamChunk)
                } else if (content.type === 'tool_use') {
                  // 记录工具调用
                  pendingToolCalls.set(content.id, {
                    name: content.name,
                    args: content.input
                  })

                  // 检查是否是 AskUserQuestion 工具调用
                  if (content.name === 'AskUserQuestion') {
                    console.log('[Claude] AskUserQuestion detected:', JSON.stringify(content.input, null, 2))
                    // 发送输入请求事件，包含完整的问题信息
                    this.emit('input_required', {
                      toolUseId: content.id,
                      questions: content.input?.questions || [],
                      metadata: content.input?.metadata,
                    })
                  }

                  // 发送工具调用事件，包含完整的参数信息
                  this.emit('tool_call', {
                    type: 'tool_use',
                    toolName: content.name,
                    toolArgs: content.input,
                    toolUseId: content.id,
                    content: this.formatToolCall(content.name, content.input),
                  } as StreamChunk)
                }
              }
            }

            // 处理 user 消息中的 tool_result
            if (parsed.type === 'user' && parsed.message?.content) {
              for (const content of parsed.message.content) {
                if (content.type === 'tool_result') {
                  const toolCall = pendingToolCalls.get(content.tool_use_id)
                  const toolName = toolCall?.name || 'unknown'

                  // 发送工具结果事件
                  this.emit('tool_result', {
                    type: 'tool_result',
                    toolName: toolName,
                    toolUseId: content.tool_use_id,
                    content: this.formatToolResult(toolName, content.content, content.is_error),
                    isError: content.is_error || false,
                  } as StreamChunk)

                  // 清理已完成的工具调用
                  pendingToolCalls.delete(content.tool_use_id)
                }
              }
            }

            // 处理 content_block_start - 工具调用开始（增量流式输出格式）
            if (parsed.type === 'content_block_start' && parsed.content_block?.type === 'tool_use') {
              const toolName = parsed.content_block.name
              const toolUseId = parsed.content_block.id

              pendingToolCalls.set(toolUseId, { name: toolName, args: {} })

              this.emit('tool_call', {
                type: 'tool_use',
                toolName: toolName,
                toolUseId: toolUseId,
                content: `开始调用工具: ${toolName}`,
              } as StreamChunk)
            }

            // 处理 result 类型 - 最终结果
            if (parsed.type === 'result') {
              if (parsed.result && !responseContent) {
                responseContent = parsed.result
              }
              // 发送完整的结果信息
              this.emit('result', {
                type: 'result',
                subtype: parsed.subtype,
                isError: parsed.is_error,
                durationMs: parsed.duration_ms,
                numTurns: parsed.num_turns,
                content: parsed.result,
              })
            }

          } catch {
            // 忽略非 JSON 行
          }
        }
      })

      this.process.stderr?.on('data', (data) => {
        const chunk = data.toString()
        stderr += chunk
        console.log('[Claude] stderr chunk:', chunk)
      })

      this.process.on('close', (code) => {
        console.log('[Claude] Process closed with code:', code)
        console.log('[Claude] stdout length:', stdout.length)
        console.log('[Claude] Response content:', responseContent.substring(0, 200))

        if (this.isAborted) {
          reject(new Error('Task aborted by user'))
        } else if (code === 0) {
          resolve({
            sessionId,
            content: responseContent || stdout,
          })
        } else {
          reject(new Error(stderr || `Process exited with code ${code}`))
        }
        this.process = null
      })

      this.process.on('error', (error) => {
        console.log('[Claude] Process error:', error.message)
        reject(error)
        this.process = null
      })
    })
  }

  private formatToolCall(toolName: string, args: any): string {
    // 格式化工具调用信息，使其更易读
    switch (toolName) {
      case 'Read':
        return `📖 读取文件: ${args?.file_path || '未知路径'}`
      case 'Write':
        return `✏️ 写入文件: ${args?.file_path || '未知路径'}`
      case 'Edit':
        return `🔧 编辑文件: ${args?.file_path || '未知路径'}`
      case 'Bash':
        const cmd = args?.command || ''
        return `💻 执行命令: ${cmd.substring(0, 100)}${cmd.length > 100 ? '...' : ''}`
      case 'Glob':
        return `🔍 搜索文件: ${args?.pattern || '未知模式'}`
      case 'Grep':
        return `🔎 搜索内容: ${args?.pattern || '未知模式'}`
      case 'Task':
        return `📋 创建任务: ${args?.description || '未知任务'}`
      case 'WebFetch':
        return `🌐 获取网页: ${args?.url || '未知URL'}`
      case 'WebSearch':
        return `🔍 网页搜索: ${args?.query || '未知查询'}`
      case 'TodoWrite':
        return `📝 更新待办列表`
      case 'AskUserQuestion':
        return `❓ 询问用户问题`
      default:
        return `🔧 调用工具: ${toolName}`
    }
  }

  private formatToolResult(toolName: string, content: any, isError: boolean): string {
    if (isError) {
      return `❌ ${toolName} 执行失败: ${typeof content === 'string' ? content.substring(0, 200) : JSON.stringify(content).substring(0, 200)}`
    }

    // 根据工具类型格式化结果
    if (typeof content === 'string') {
      const truncated = content.length > 500 ? content.substring(0, 500) + '...' : content
      return `✅ ${toolName} 完成: ${truncated}`
    }

    return `✅ ${toolName} 完成`
  }

  private buildArgs(options: ClaudeOptions): string[] {
    // 不包含 -p 和 prompt，因为我们通过 stdin 传递
    const args = [
      '-p',  // 使用 print 模式
      '--output-format', 'stream-json',
      '--verbose',
    ]

    // 根据权限模式设置参数
    // Claude Code --permission-mode 支持的选项: acceptEdits, bypassPermissions, default, delegate, dontAsk, plan
    const permissionMode = options.permissionMode || 'bypassPermissions'
    switch (permissionMode) {
      case 'plan':
        // Plan mode - 只规划不执行
        args.push('--permission-mode', 'plan')
        break
      case 'bypassPermissions':
        // 绕过所有权限检查
        args.push('--permission-mode', 'bypassPermissions')
        break
      case 'askEdits':
        // 编辑前询问 (default 模式)
        args.push('--permission-mode', 'default')
        break
      case 'autoEdits':
        // 自动编辑 (acceptEdits 模式)
        args.push('--permission-mode', 'acceptEdits')
        break
    }

    if (options.sessionId) {
      args.push('--resume', options.sessionId)
    }

    return args
  }

  abort(): boolean {
    if (this.process) {
      console.log('[Claude] Aborting process, PID:', this.process.pid)
      this.isAborted = true
      this.process.kill('SIGTERM')
      // 如果 SIGTERM 没效果，强制 SIGKILL
      setTimeout(() => {
        if (this.process) {
          this.process.kill('SIGKILL')
        }
      }, 1000)
      return true
    }
    return false
  }

  isRunning(): boolean {
    return this.process !== null
  }
}
