'use client'

import { useScrollAnimation } from '@/hooks/useScrollAnimation'

const techStack = [
  { name: 'Next.js 15', category: '前端框架', color: 'from-black to-gray-800' },
  { name: 'React 19', category: 'UI 库', color: 'from-blue-400 to-blue-600' },
  { name: 'TypeScript', category: '类型安全', color: 'from-blue-500 to-blue-700' },
  { name: 'Tailwind CSS', category: '样式方案', color: 'from-cyan-400 to-blue-500' },
  { name: 'PostgreSQL', category: '关系数据库', color: 'from-blue-600 to-indigo-600' },
  { name: 'WebSocket', category: '实时通信', color: 'from-purple-500 to-pink-600' },
  { name: 'Prisma ORM', category: '数据访问', color: 'from-gray-600 to-gray-800' },
  { name: 'Monaco Editor', category: '代码编辑', color: 'from-blue-500 to-blue-700' },
  { name: 'NextAuth.js', category: '身份认证', color: 'from-purple-600 to-pink-600' },
]

export default function TechStackSection() {
  const titleAnimation = useScrollAnimation()

  return (
    <section id="tech" className="py-24 bg-white">
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
            现代技术栈
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            基于最新的 Web 技术构建
          </p>
        </div>

        {/* 技术栈网格 - 苹果风格 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {techStack.map((tech, index) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const cardAnimation = useScrollAnimation()

            return (
              <div
                key={index}
                ref={cardAnimation.ref}
                className={`group relative bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 hover:shadow-lg border border-gray-100 hover:border-gray-200 transition-all duration-700 hover:-translate-y-1 ${
                  cardAnimation.isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-20'
                }`}
                style={{
                  transitionDelay: `${index * 100}ms`
                }}
              >
                {/* 顶部渐变装饰 */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${tech.color} rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {tech.name}
                  </h3>
                  <p className="text-sm text-gray-600">{tech.category}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* 技术栈说明 */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
            采用业界领先的技术栈,确保应用的高性能、高可靠性和可维护性。
            所有技术都经过精心选择和优化,为你提供最佳的开发体验。
          </p>
        </div>
      </div>
    </section>
  )
}
