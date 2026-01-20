'use client'

import { Session } from 'next-auth'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

interface CTASectionProps {
  session: Session | null
}

export default function CTASection({ session }: CTASectionProps) {
  const router = useRouter()

  return (
    <section className="relative py-32 bg-white">
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* 标题 - 苹果风格 */}
          <h2 className="text-5xl md:text-6xl font-semibold mb-6 text-gray-900 tracking-tight">
            {session ? '继续你的开发之旅' : '准备好开始了吗?'}
          </h2>

          {/* 描述 */}
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            {session
              ? '欢迎回来,进入工作台继续你的项目'
              : '免费注册,立即体验 AI 驱动的远程开发'}
          </p>

          {/* CTA按钮 - 苹果风格 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {session ? (
              <button
                onClick={() => router.push('/workspace')}
                className="group px-8 py-3 bg-blue-600 text-white rounded-full font-medium text-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2"
              >
                进入工作台
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push('/register')}
                  className="group px-8 py-3 bg-blue-600 text-white rounded-full font-medium text-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2"
                >
                  免费开始
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => router.push('/login')}
                  className="px-8 py-3 text-blue-600 rounded-full font-medium text-lg hover:bg-gray-100 transition-all duration-200"
                >
                  登录账户
                </button>
              </>
            )}
          </div>

          {/* 附加信息 - 苹果风格 */}
          {!session && (
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
              <span>免费使用</span>
              <span>·</span>
              <span>无需信用卡</span>
              <span>·</span>
              <span>1 分钟快速设置</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
