import { exec } from 'child_process'
import { promisify } from 'util'
import { GitStatus, GitCommit, GitBranch } from '@wcc/shared'

const execAsync = promisify(exec)

export class GitHandler {
  private async run(command: string, cwd: string): Promise<string> {
    try {
      const { stdout } = await execAsync(command, { cwd, encoding: 'utf-8' })
      return stdout.trim()
    } catch (error: any) {
      throw new Error(error.stderr || error.message)
    }
  }

  async status(cwd: string): Promise<GitStatus> {
    // Get current branch
    const branch = await this.run('git rev-parse --abbrev-ref HEAD', cwd)

    // Get ahead/behind counts
    let ahead = 0
    let behind = 0
    try {
      const counts = await this.run('git rev-list --left-right --count HEAD...@{upstream}', cwd)
      const [aheadStr, behindStr] = counts.split('\t')
      ahead = parseInt(aheadStr, 10) || 0
      behind = parseInt(behindStr, 10) || 0
    } catch {
      // No upstream configured
    }

    // Get file status
    const statusOutput = await this.run('git status --porcelain', cwd)
    const staged: string[] = []
    const unstaged: string[] = []
    const untracked: string[] = []

    if (statusOutput) {
      const lines = statusOutput.split('\n')
      for (const line of lines) {
        if (!line) continue
        const indexStatus = line[0]
        const workStatus = line[1]
        const file = line.slice(3)

        if (indexStatus === '?' && workStatus === '?') {
          untracked.push(file)
        } else {
          if (indexStatus !== ' ' && indexStatus !== '?') {
            staged.push(file)
          }
          if (workStatus !== ' ' && workStatus !== '?') {
            unstaged.push(file)
          }
        }
      }
    }

    const isClean = staged.length === 0 && unstaged.length === 0 && untracked.length === 0
    return { branch, ahead, behind, staged, unstaged, untracked, isClean }
  }

  async commit(cwd: string, message: string): Promise<{ hash: string; message: string }> {
    if (!message) {
      throw new Error('Commit message is required')
    }

    // Escape message for shell
    const escapedMessage = message.replace(/"/g, '\\"')
    await this.run(`git commit -m "${escapedMessage}"`, cwd)

    // Get the commit hash
    const hash = await this.run('git rev-parse HEAD', cwd)

    return { hash: hash.substring(0, 7), message }
  }

  async push(cwd: string, remote = 'origin', branch?: string): Promise<{ success: boolean }> {
    const branchArg = branch || ''
    await this.run(`git push ${remote} ${branchArg}`.trim(), cwd)
    return { success: true }
  }

  async pull(cwd: string, remote = 'origin', branch?: string): Promise<{ success: boolean; message: string }> {
    const branchArg = branch || ''
    const output = await this.run(`git pull ${remote} ${branchArg}`.trim(), cwd)
    return { success: true, message: output }
  }

  async branches(cwd: string): Promise<GitBranch[]> {
    const output = await this.run('git branch -a', cwd)
    const branches: GitBranch[] = []

    if (output) {
      const lines = output.split('\n')
      for (const line of lines) {
        const isCurrent = line.startsWith('*')
        let name = line.replace(/^\*?\s+/, '').trim()

        // Handle remote branches
        let remote: string | undefined
        if (name.startsWith('remotes/')) {
          const parts = name.replace('remotes/', '').split('/')
          remote = parts[0]
          name = parts.slice(1).join('/')
        }

        // Skip HEAD pointer
        if (name.includes('HEAD ->')) continue

        branches.push({
          name,
          current: isCurrent,
          remote,
        })
      }
    }

    return branches
  }

  async checkout(cwd: string, branch: string): Promise<{ success: boolean }> {
    await this.run(`git checkout ${branch}`, cwd)
    return { success: true }
  }

  async log(cwd: string, limit = 10): Promise<GitCommit[]> {
    const format = '--pretty=format:%H|%h|%s|%an|%ai'
    const output = await this.run(`git log ${format} -n ${limit}`, cwd)
    const commits: GitCommit[] = []

    if (output) {
      const lines = output.split('\n')
      for (const line of lines) {
        const [hash, shortHash, message, author, date] = line.split('|')
        if (hash) {
          commits.push({
            hash,
            shortHash,
            message,
            author,
            date,
          })
        }
      }
    }

    return commits
  }

  async diff(cwd: string, staged = false): Promise<string> {
    const stagedArg = staged ? '--staged' : ''
    return await this.run(`git diff ${stagedArg}`.trim(), cwd)
  }

  async add(cwd: string, files: string[] | string = '.'): Promise<{ success: boolean }> {
    const filesArg = Array.isArray(files) ? files.join(' ') : files
    await this.run(`git add ${filesArg}`, cwd)
    return { success: true }
  }

  async reset(cwd: string, files?: string[]): Promise<{ success: boolean }> {
    const filesArg = files ? files.join(' ') : ''
    await this.run(`git reset ${filesArg}`.trim(), cwd)
    return { success: true }
  }

  async stash(cwd: string, message?: string): Promise<{ success: boolean }> {
    const messageArg = message ? `-m "${message.replace(/"/g, '\\"')}"` : ''
    await this.run(`git stash ${messageArg}`.trim(), cwd)
    return { success: true }
  }

  async stashPop(cwd: string): Promise<{ success: boolean }> {
    await this.run('git stash pop', cwd)
    return { success: true }
  }
}
