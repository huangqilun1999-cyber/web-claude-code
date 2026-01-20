'use client'

import {
  MessageSquare,
  FolderTree,
  Terminal,
  GitBranch,
} from 'lucide-react'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

const features = [
  {
    icon: MessageSquare,
    title: 'AI 智能对话',
    description: '与 Claude Code 实时交互,获取代码建议、调试帮助和架构指导。让 AI 成为你的编程伙伴',
  },
  {
    icon: FolderTree,
    title: '远程文件管理',
    description: '完整的文件系统访问,内置 Monaco 编辑器。支持语法高亮、自动补全和实时保存',
  },
  {
    icon: Terminal,
    title: '完整 Web 终端',
    description: '在浏览器中运行任何命令。完整的 PTY 支持,就像使用本地终端一样流畅',
  },
  {
    icon: GitBranch,
    title: '无缝 Git 集成',
    description: '可视化的版本控制。查看状态、提交更改、推送代码,全部在 Web 界面完成',
  },
]

export default function FeaturesSection() {
  const titleAnimation = useScrollAnimation()

  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="container mx-auto px-6 relative z-10">
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
            一站式开发体验
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            让你在任何设备上都能享受完整的开发环境
          </p>
        </div>

        {/* 功能卡片网格 - 苹果风格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const cardAnimation = useScrollAnimation()

            return (
              <div
                key={index}
                ref={cardAnimation.ref}
                className={`group relative bg-white rounded-3xl p-10 shadow-sm hover:shadow-lg transition-all duration-700 hover:-translate-y-1 ${
                  cardAnimation.isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-20'
                }`}
                style={{
                  transitionDelay: `${index * 150}ms`
                }}
              >
                {/* 图标 - 简约风格 */}
                <div className="mb-6">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                </div>

                {/* 内容 */}
                <h3 className="text-2xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* 额外特性标签 */}
        <div className="mt-20 flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
          {[
            '实时同步',
            '安全加密',
            '跨平台支持',
            '开源项目',
            '活跃社区',
            '持续更新'
          ].map((tag, index) => (
            <div
              key={index}
              className="px-6 py-3 bg-white rounded-full border border-gray-200 text-gray-600 hover:border-blue-600 hover:text-blue-600 transition-all duration-200"
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
