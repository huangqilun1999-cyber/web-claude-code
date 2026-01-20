'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, CheckCircle, HelpCircle, SkipForward } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuestionOption {
  label: string
  description?: string
}

interface Question {
  question: string
  header?: string
  options: QuestionOption[]
  multiSelect?: boolean
}

export interface InputRequest {
  requestId: string
  sessionId: string
  questions: Question[]
}

interface UserInputDialogProps {
  request: InputRequest | null
  onSubmit: (requestId: string, answers: Record<string, string | string[]>) => void
  onClose: () => void
}

export function UserInputDialog({ request, onSubmit, onClose }: UserInputDialogProps) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({})
  const requestId = request?.requestId

  // 重置状态当请求变化时
  useEffect(() => {
    if (!requestId) return
    setAnswers({})
    setCustomInputs({})
  }, [requestId])

  const handleOptionSelect = useCallback((questionIndex: number, optionLabel: string, multiSelect: boolean) => {
    const key = `q${questionIndex}`

    if (multiSelect) {
      setAnswers(prev => {
        const current = (prev[key] as string[]) || []
        if (current.includes(optionLabel)) {
          return { ...prev, [key]: current.filter(o => o !== optionLabel) }
        } else {
          return { ...prev, [key]: [...current, optionLabel] }
        }
      })
    } else {
      setAnswers(prev => ({ ...prev, [key]: optionLabel }))
    }
  }, [])

  const handleCustomInput = useCallback((questionIndex: number, value: string) => {
    setCustomInputs(prev => ({ ...prev, [`q${questionIndex}`]: value }))
  }, [])

  const handleSubmit = useCallback(() => {
    if (!request) return

    // 合并选择的选项和自定义输入
    const finalAnswers: Record<string, string | string[]> = {}

    request.questions.forEach((q, index) => {
      const key = `q${index}`
      const customInput = customInputs[key]

      if (customInput?.trim()) {
        // 如果有自定义输入，使用自定义输入
        finalAnswers[key] = customInput.trim()
      } else if (answers[key]) {
        // 否则使用选择的选项
        finalAnswers[key] = answers[key]
      }
    })

    onSubmit(request.requestId, finalAnswers)
  }, [request, answers, customInputs, onSubmit])

  if (!request) return null

  const allQuestionsAnswered = request.questions.every((q, index) => {
    const key = `q${index}`
    return answers[key] || customInputs[key]?.trim()
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 对话框 */}
      <div className={cn(
        'relative bg-white dark:bg-gray-800 rounded-lg shadow-xl',
        'w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col',
        'animate-in fade-in zoom-in-95 duration-200'
      )}>
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-amber-50 dark:bg-amber-900/30">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-200">Claude 需要您的输入</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-800/50"
            title="跳过"
          >
            <X className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {request.questions.map((question, qIndex) => (
            <div key={qIndex} className="space-y-3">
              {question.header && (
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {question.header}
                </div>
              )}
              <div className="text-sm font-medium">{question.question}</div>

              {/* 选项 */}
              <div className="space-y-2">
                {question.options.map((option, oIndex) => {
                  const key = `q${qIndex}`
                  const isSelected = question.multiSelect
                    ? ((answers[key] as string[]) || []).includes(option.label)
                    : answers[key] === option.label

                  return (
                    <button
                      key={oIndex}
                      type="button"
                      onClick={() => handleOptionSelect(qIndex, option.label, !!question.multiSelect)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg border transition-all',
                        'hover:border-blue-300 dark:hover:border-blue-600',
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-600'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-4 h-4 mt-0.5 rounded flex-shrink-0 border',
                          question.multiSelect ? 'rounded' : 'rounded-full',
                          isSelected
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300 dark:border-gray-500'
                        )}>
                          {isSelected && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{option.label}</div>
                          {option.description && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* 自定义输入 */}
              <div className="mt-2">
                <input
                  type="text"
                  value={customInputs[`q${qIndex}`] || ''}
                  onChange={(e) => handleCustomInput(qIndex, e.target.value)}
                  placeholder="或者输入其他内容..."
                  className={cn(
                    'w-full px-3 py-2 text-sm rounded-lg border',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    'dark:bg-gray-700 dark:border-gray-600'
                  )}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 px-4 py-3 border-t bg-gray-50 dark:bg-gray-900/50">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <SkipForward className="w-4 h-4" />
            跳过
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allQuestionsAnswered}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-sm bg-amber-500 text-white rounded-lg',
              'hover:bg-amber-600 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <CheckCircle className="w-4 h-4" />
            确认回答
          </button>
        </div>
      </div>
    </div>
  )
}
