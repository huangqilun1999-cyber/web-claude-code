'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function HeroSection() {
  const router = useRouter()
  const [terminalText, setTerminalText] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [scrollY, setScrollY] = useState(0)

  // 终端打字效果
  useEffect(() => {
    const text = 'npm run dev'
    let index = 0

    const typingInterval = setInterval(() => {
      if (index < text.length) {
        setTerminalText(text.substring(0, index + 1))
        index++
      } else {
        clearInterval(typingInterval)
      }
    }, 150)

    // 光标闪烁
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 500)

    return () => {
      clearInterval(typingInterval)
      clearInterval(cursorInterval)
    }
  }, [])

  // 视差滚动效果
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-white">
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* 苹果风格主标题 */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-semibold mb-6 tracking-tight leading-none animate-fade-in-up">
            <span className="block text-gray-900">
              Web Claude Code
            </span>
          </h1>

          {/* 副标题 */}
          <p className="text-2xl md:text-3xl lg:text-4xl text-gray-600 mb-8 font-normal leading-snug animate-fade-in-up animation-delay-200">
            随时随地驾驭 AI 编程
          </p>

          {/* 简短描述 */}
          <p className="text-lg md:text-xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            通过 Web 界面远程控制 Claude Code,享受完整的开发体验
          </p>

          {/* CTA按钮 - 苹果风格 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
            <button
              onClick={() => router.push('/register')}
              className="group px-8 py-3 bg-blue-600 text-white rounded-full font-medium text-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2"
            >
              立即开始
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => {
                document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="px-8 py-3 text-blue-600 rounded-full font-medium text-lg hover:bg-gray-100 transition-all duration-200"
            >
              了解更多
            </button>
          </div>

          {/* 产品预览图 - 苹果风格 + 视差效果 */}
          <div
            className="relative max-w-6xl mx-auto"
            style={{
              transform: `translateY(${scrollY * 0.1}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            <div className="aspect-video rounded-3xl bg-white border border-gray-200 shadow-2xl overflow-hidden animate-scale-up">
              {/* 浏览器顶栏 */}
              <div className="h-10 bg-gray-50 border-b border-gray-200 flex items-center px-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-6 bg-white rounded-md border border-gray-200 flex items-center px-3">
                    <span className="text-xs text-gray-500">localhost:3000/workspace</span>
                  </div>
                </div>
              </div>

              {/* 产品界面模拟 */}
              <div className="h-full bg-gray-900 p-6 flex gap-4">
                {/* 侧边栏 */}
                <div className="w-64 bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="h-6 bg-blue-600 rounded flex items-center px-3">
                    <div className="w-3 h-3 bg-white rounded-full mr-2" />
                    <div className="h-2 bg-white rounded w-20" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-full" />
                    <div className="h-4 bg-gray-700 rounded w-3/4 ml-4" />
                    <div className="h-4 bg-gray-700 rounded w-3/4 ml-4" />
                    <div className="h-4 bg-gray-700 rounded w-full" />
                    <div className="h-4 bg-gray-700 rounded w-2/3 ml-4" />
                  </div>
                </div>

                {/* 主内容区 */}
                <div className="flex-1 space-y-4">
                  {/* 编辑器 */}
                  <div className="h-2/3 bg-gray-800 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <span className="text-purple-400 text-xs">import</span>
                        <span className="text-blue-400 text-xs">React</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded w-3/4" />
                      <div className="h-2 bg-gray-700 rounded w-2/3 ml-4" />
                      <div className="h-2 bg-gray-700 rounded w-1/2 ml-4" />
                    </div>
                  </div>

                  {/* 终端 - 带打字动画 */}
                  <div className="h-1/3 bg-black rounded-lg p-4">
                    <div className="space-y-1">
                      <div className="flex gap-2 text-xs font-mono">
                        <span className="text-green-400">$</span>
                        <span className="text-gray-300">
                          {terminalText}
                          {showCursor && terminalText.length < 11 && (
                            <span className="inline-block w-1.5 h-3 bg-green-400 ml-0.5 animate-pulse" />
                          )}
                        </span>
                      </div>
                      {terminalText.length >= 11 && (
                        <div className="text-xs text-blue-400 animate-fade-in">
                          Server running...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 聊天面板 - 带动画 */}
                <div className="w-80 bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="h-6 bg-gray-700 rounded flex items-center px-3">
                    <div className="h-2 bg-gray-500 rounded w-24" />
                  </div>
                  <div className="space-y-2">
                    <div className="bg-blue-600 rounded-lg p-2 h-12 animate-slide-in-from-right" />
                    <div className="bg-gray-700 rounded-lg p-2 h-16 animate-slide-in-from-left animation-delay-200" />
                    <div className="bg-blue-600 rounded-lg p-2 h-10 animate-slide-in-from-right animation-delay-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
