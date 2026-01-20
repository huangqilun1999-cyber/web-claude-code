'use client'

import {
  FileText,
  FileCode,
  FileJson,
  FileImage,
  File,
} from 'lucide-react'

interface FileIconProps {
  extension: string
  className?: string
}

export function FileIcon({ extension, className = 'w-4 h-4' }: FileIconProps) {
  const ext = extension.toLowerCase()

  // 代码文件
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'go', 'rs', 'c', 'cpp', 'h', 'cs', 'php', 'rb', 'swift', 'kt'].includes(ext)) {
    return <FileCode className={`${className} text-blue-500`} />
  }

  // JSON文件
  if (['json', 'jsonc'].includes(ext)) {
    return <FileJson className={`${className} text-yellow-500`} />
  }

  // 配置文件
  if (['yaml', 'yml', 'toml', 'ini', 'env'].includes(ext)) {
    return <FileText className={`${className} text-purple-500`} />
  }

  // 文档文件
  if (['md', 'txt', 'doc', 'docx', 'pdf'].includes(ext)) {
    return <FileText className={`${className} text-gray-500`} />
  }

  // 图片文件
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp'].includes(ext)) {
    return <FileImage className={`${className} text-green-500`} />
  }

  // HTML/CSS
  if (['html', 'htm', 'css', 'scss', 'less'].includes(ext)) {
    return <FileCode className={`${className} text-orange-500`} />
  }

  // 默认
  return <File className={`${className} text-gray-400`} />
}
