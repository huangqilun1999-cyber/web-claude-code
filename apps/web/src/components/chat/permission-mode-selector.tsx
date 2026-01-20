'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Shield, ShieldOff, FileEdit, Wand2, Map } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PermissionMode } from '@/stores/session-store'

interface PermissionModeSelectorProps {
  value: PermissionMode
  onChange: (mode: PermissionMode) => void
  disabled?: boolean
}

const modeConfig: Record<PermissionMode, {
  label: string
  shortLabel: string
  description: string
  icon: React.ElementType
  color: string
}> = {
  plan: {
    label: 'Plan Mode',
    shortLabel: 'Plan',
    description: '规划模式 - Claude 只会分析和规划，不会执行任何修改',
    icon: Map,
    color: 'text-purple-500',
  },
  bypassPermissions: {
    label: 'Bypass Permissions',
    shortLabel: 'Bypass',
    description: '绕过权限 - 自动执行所有操作，无需确认',
    icon: ShieldOff,
    color: 'text-orange-500',
  },
  askEdits: {
    label: 'Ask Before Edits',
    shortLabel: 'Ask',
    description: '编辑前询问 - 每次编辑文件前都会询问确认',
    icon: FileEdit,
    color: 'text-blue-500',
  },
  autoEdits: {
    label: 'Edit Automatically',
    shortLabel: 'Auto',
    description: '自动编辑 - 自动执行编辑，但其他操作需确认',
    icon: Wand2,
    color: 'text-green-500',
  },
}

export function PermissionModeSelector({
  value,
  onChange,
  disabled = false,
}: PermissionModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentMode = modeConfig[value]
  const Icon = currentMode.icon

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
          'border transition-colors',
          'hover:bg-gray-100 dark:hover:bg-gray-700',
          disabled && 'opacity-50 cursor-not-allowed',
          currentMode.color
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{currentMode.shortLabel}</span>
        <ChevronDown className={cn(
          'w-3 h-3 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className={cn(
          'absolute top-full left-0 mt-1 z-50',
          'bg-white dark:bg-gray-800 rounded-lg shadow-lg border',
          'min-w-[240px] py-1',
          'animate-in fade-in slide-in-from-top-1 duration-150'
        )}>
          {(Object.keys(modeConfig) as PermissionMode[]).map((mode) => {
            const config = modeConfig[mode]
            const ModeIcon = config.icon
            const isSelected = mode === value

            return (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  onChange(mode)
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full flex items-start gap-3 px-3 py-2 text-left',
                  'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                  isSelected && 'bg-gray-50 dark:bg-gray-700/50'
                )}
              >
                <ModeIcon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', config.color)} />
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    'text-sm font-medium',
                    isSelected && config.color
                  )}>
                    {config.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {config.description}
                  </div>
                </div>
                {isSelected && (
                  <div className={cn('w-2 h-2 rounded-full mt-1.5', config.color.replace('text-', 'bg-'))} />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
