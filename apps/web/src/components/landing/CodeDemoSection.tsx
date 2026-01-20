'use client'

import { MessageSquare, Code2, Terminal } from 'lucide-react'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

export default function CodeDemoSection() {
  const titleAnimation = useScrollAnimation()
  const demo1Animation = useScrollAnimation()
  const demo2Animation = useScrollAnimation()
  const demo3Animation = useScrollAnimation()

  return (
    <section id="demo" className="py-24 bg-gray-50">
      <div className="container mx-auto px-6">
        {/* 标题 - 苹果风格 */}
        <div
          ref={titleAnimation.ref}
          className={`text-center mb-20 transition-all duration-1000 ${
            titleAnimation.isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-5xl md:text-6xl font-semibold mb-4 text-gray-900 tracking-tight">
            强大的功能演示
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            在浏览器中完成所有开发工作
          </p>
        </div>

        {/* 功能演示网格 */}
        <div className="max-w-6xl mx-auto space-y-8">
          {/* AI 对话演示 */}
          <div
            ref={demo1Animation.ref}
            className={`rounded-3xl bg-white border border-gray-200 shadow-lg overflow-hidden p-8 transition-all duration-1000 ${
              demo1Animation.isVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-20'
            }`}
          >
            <div className="flex items-start gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900">AI 智能对话</h3>
                </div>
                <p className="text-lg text-gray-600 mb-6">
                  与 Claude Code 实时对话,获取代码建议、调试帮助和技术解答
                </p>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
                    <div className="flex-1 bg-gray-100 rounded-2xl p-4">
                      <p className="text-sm text-gray-700">帮我创建一个 React 组件</p>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <div className="flex-1 bg-blue-600 rounded-2xl p-4 max-w-md">
                      <p className="text-sm text-white">好的,我来为你创建一个 React 组件...</p>
                    </div>
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex-shrink-0" />
                  </div>
                </div>
              </div>
              <div className="hidden md:block w-1/3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 flex items-center justify-center">
                <MessageSquare className="w-24 h-24 text-blue-600 opacity-20" />
              </div>
            </div>
          </div>

          {/* 代码编辑演示 */}
          <div
            ref={demo2Animation.ref}
            className={`rounded-3xl bg-white border border-gray-200 shadow-lg overflow-hidden p-8 transition-all duration-1000 delay-200 ${
              demo2Animation.isVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-20'
            }`}
          >
            <div className="flex items-start gap-8">
              <div className="hidden md:block w-1/3 bg-gray-900 rounded-2xl p-6">
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex gap-2">
                    <span className="text-purple-400">import</span>
                    <span className="text-yellow-400">React</span>
                    <span className="text-gray-400">from</span>
                    <span className="text-green-400">&apos;react&apos;</span>
                  </div>
                  <div className="text-gray-400">
                    <div className="mt-2">export default function App() {'{'}</div>
                    <div className="ml-4">return (</div>
                    <div className="ml-8 text-pink-400">&lt;div&gt;</div>
                    <div className="ml-12 text-gray-300">Hello World</div>
                    <div className="ml-8 text-pink-400">&lt;/div&gt;</div>
                    <div className="ml-4">)</div>
                    <div>{'}'}</div>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                    <Code2 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900">在线代码编辑</h3>
                </div>
                <p className="text-lg text-gray-600 mb-6">
                  内置 Monaco 编辑器,支持语法高亮、自动补全和智能提示
                </p>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    完整的文件系统访问
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    实时保存和同步
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    多文件标签页管理
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 终端演示 */}
          <div
            ref={demo3Animation.ref}
            className={`rounded-3xl bg-white border border-gray-200 shadow-lg overflow-hidden p-8 transition-all duration-1000 delay-400 ${
              demo3Animation.isVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-20'
            }`}
          >
            <div className="flex items-start gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                    <Terminal className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900">Web 终端</h3>
                </div>
                <p className="text-lg text-gray-600 mb-6">
                  完整的 PTY 终端支持,在浏览器中运行任何命令
                </p>
                <div className="bg-black rounded-2xl p-6 font-mono text-sm">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <span className="text-green-400">$</span>
                      <span className="text-gray-300">npm install</span>
                    </div>
                    <div className="text-blue-400">added 254 packages in 12s</div>
                    <div className="flex gap-2 mt-3">
                      <span className="text-green-400">$</span>
                      <span className="text-gray-300">npm run dev</span>
                    </div>
                    <div className="text-gray-400">Server running on http://localhost:3000</div>
                    <div className="flex gap-2">
                      <span className="text-green-400">$</span>
                      <span className="animate-pulse">_</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hidden md:block w-1/3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 flex items-center justify-center">
                <Terminal className="w-24 h-24 text-gray-600 opacity-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
