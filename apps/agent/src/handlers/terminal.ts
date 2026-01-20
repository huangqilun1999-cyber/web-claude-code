import * as pty from 'node-pty'
import os from 'os'

interface PtyProcess {
  id: string
  process: pty.IPty
  onData: (data: string) => void
}

export class TerminalHandler {
  private terminals = new Map<string, PtyProcess>()

  create(
    terminalId: string,
    cols: number,
    rows: number,
    onData: (data: string) => void
  ): { id: string } {
    // 如果已存在同ID的终端，先关闭
    if (this.terminals.has(terminalId)) {
      this.close(terminalId)
    }

    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash'

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: cols || 80,
      rows: rows || 30,
      cwd: os.homedir(),
      env: process.env as Record<string, string>,
    })

    ptyProcess.onData((data) => {
      onData(data)
    })

    this.terminals.set(terminalId, {
      id: terminalId,
      process: ptyProcess,
      onData,
    })

    return { id: terminalId }
  }

  write(terminalId: string, data: string): void {
    const terminal = this.terminals.get(terminalId)
    if (terminal) {
      terminal.process.write(data)
    }
  }

  resize(terminalId: string, cols: number, rows: number): void {
    const terminal = this.terminals.get(terminalId)
    if (terminal) {
      terminal.process.resize(cols, rows)
    }
  }

  close(terminalId: string): void {
    const terminal = this.terminals.get(terminalId)
    if (terminal) {
      terminal.process.kill()
      this.terminals.delete(terminalId)
    }
  }

  closeAll(): void {
    this.terminals.forEach((terminal) => {
      terminal.process.kill()
    })
    this.terminals.clear()
  }

  getTerminal(terminalId: string): PtyProcess | undefined {
    return this.terminals.get(terminalId)
  }

  getAllTerminals(): string[] {
    return Array.from(this.terminals.keys())
  }
}

// 单例导出
export const terminalHandler = new TerminalHandler()
