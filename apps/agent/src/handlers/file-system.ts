import fs from 'fs/promises'
import path from 'path'
import { isValidPath, FileInfo } from '@wcc/shared'

export class FileSystemHandler {
  private allowedPaths?: string[]

  constructor(allowedPaths?: string[]) {
    this.allowedPaths = allowedPaths
  }

  private validatePath(filePath: string): void {
    if (!isValidPath(filePath, this.allowedPaths)) {
      throw new Error('Access denied: path not allowed')
    }
  }

  async list(dirPath: string): Promise<FileInfo[]> {
    this.validatePath(dirPath)

    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    const files: FileInfo[] = []

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      const stats = await fs.stat(fullPath).catch(() => null)

      files.push({
        name: entry.name,
        path: fullPath,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: stats?.size,
        modifiedAt: stats?.mtime?.toISOString(),
        extension: entry.isFile() ? path.extname(entry.name).slice(1) : undefined,
      })
    }

    return files.sort((a, b) => {
      // Directories first, then files
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
  }

  async read(filePath: string): Promise<{ content: string; encoding: string }> {
    this.validatePath(filePath)

    const content = await fs.readFile(filePath, 'utf-8')
    return { content, encoding: 'utf-8' }
  }

  async write(filePath: string, content: string): Promise<{ success: boolean }> {
    this.validatePath(filePath)

    // Ensure parent directory exists
    const dir = path.dirname(filePath)
    await fs.mkdir(dir, { recursive: true })

    await fs.writeFile(filePath, content, 'utf-8')
    return { success: true }
  }

  async delete(filePath: string): Promise<{ success: boolean }> {
    this.validatePath(filePath)

    const stats = await fs.stat(filePath)
    if (stats.isDirectory()) {
      await fs.rm(filePath, { recursive: true })
    } else {
      await fs.unlink(filePath)
    }

    return { success: true }
  }

  async rename(oldPath: string, newPath: string): Promise<{ success: boolean }> {
    this.validatePath(oldPath)
    this.validatePath(newPath)

    await fs.rename(oldPath, newPath)
    return { success: true }
  }

  async mkdir(dirPath: string): Promise<{ success: boolean }> {
    this.validatePath(dirPath)

    await fs.mkdir(dirPath, { recursive: true })
    return { success: true }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  async stat(filePath: string): Promise<{
    size: number
    isFile: boolean
    isDirectory: boolean
    createdAt: string
    modifiedAt: string
  }> {
    this.validatePath(filePath)

    const stats = await fs.stat(filePath)
    return {
      size: stats.size,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      createdAt: stats.birthtime.toISOString(),
      modifiedAt: stats.mtime.toISOString(),
    }
  }
}
