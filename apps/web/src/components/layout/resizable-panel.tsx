'use client'

import { useState, useCallback, useRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ResizablePanelProps {
  children: ReactNode
  direction?: 'horizontal' | 'vertical'
  initialSize?: number
  minSize?: number
  maxSize?: number
  className?: string
}

export function ResizablePanel({
  children,
  direction = 'horizontal',
  initialSize = 256,
  minSize = 200,
  maxSize = 500,
  className,
}: ResizablePanelProps) {
  const [size, setSize] = useState(initialSize)
  const isDragging = useRef(false)
  const startPos = useRef(0)
  const startSize = useRef(0)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true
      startPos.current = direction === 'horizontal' ? e.clientX : e.clientY
      startSize.current = size

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return

        const currentPos = direction === 'horizontal' ? e.clientX : e.clientY
        const delta = currentPos - startPos.current
        const newSize = Math.min(
          maxSize,
          Math.max(minSize, startSize.current + delta)
        )
        setSize(newSize)
      }

      const handleMouseUp = () => {
        isDragging.current = false
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [direction, size, minSize, maxSize]
  )

  return (
    <div
      className={cn('relative flex-shrink-0', className)}
      style={{
        [direction === 'horizontal' ? 'width' : 'height']: size,
      }}
    >
      {children}

      {/* 拖动条 */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          'absolute bg-transparent hover:bg-blue-500 transition-colors z-10',
          direction === 'horizontal'
            ? 'right-0 top-0 w-1 h-full cursor-col-resize'
            : 'bottom-0 left-0 h-1 w-full cursor-row-resize'
        )}
      />
    </div>
  )
}
