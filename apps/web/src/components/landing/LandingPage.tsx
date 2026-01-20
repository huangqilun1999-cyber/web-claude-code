'use client'

import { Session } from 'next-auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import HeroSection from './HeroSection'
import FeaturesSection from './FeaturesSection'
import TechStackSection from './TechStackSection'
import CodeDemoSection from './CodeDemoSection'
import CTASection from './CTASection'
import Navigation from './Navigation'

interface LandingPageProps {
  session: Session | null
}

export default function LandingPage({ session }: LandingPageProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="relative min-h-screen bg-white text-gray-900 overflow-hidden">
      {/* 苹果风格极简背景 */}

      {/* 导航栏 */}
      <Navigation session={session} />

      {/* 主要内容 */}
      <main className="relative z-10">
        <HeroSection />
        <FeaturesSection />
        <CodeDemoSection />
        <TechStackSection />
        <CTASection session={session} />
      </main>

      {/* 页脚 - 苹果风格 */}
      <footer className="relative z-10 border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-600 text-sm">
              © 2026 Web Claude Code. 通过 Web 远程控制 Claude Code
            </div>
            <div className="flex gap-8 text-sm">
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">文档</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">GitHub</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">社区</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
