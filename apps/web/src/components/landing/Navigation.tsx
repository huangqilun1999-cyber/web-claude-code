'use client'

import { Session } from 'next-auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

interface NavigationProps {
  session: Session | null
}

export default function Navigation({ session }: NavigationProps) {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm'
          : 'bg-white/50 backdrop-blur-sm'
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo - 苹果风格 */}
          <Link
            href="/"
            className="text-xl font-semibold text-gray-900 hover:text-gray-600 transition-colors"
          >
            Web Claude Code
          </Link>

          {/* Desktop Navigation - 苹果风格 */}
          <div className="hidden md:flex items-center gap-10">
            <a
              href="#features"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              功能特性
            </a>
            <a
              href="#demo"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              代码演示
            </a>
            <a
              href="#tech"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              技术栈
            </a>
          </div>

          {/* CTA Buttons - 苹果风格 */}
          <div className="hidden md:flex items-center gap-4">
            {session ? (
              <button
                onClick={() => router.push('/workspace')}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-all duration-200"
              >
                进入工作台
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push('/login')}
                  className="px-5 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  登录
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-all duration-200"
                >
                  开始使用
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu - 苹果风格 */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 transition-all duration-300 overflow-hidden ${
          mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="container mx-auto px-6 py-6 space-y-4">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-gray-600 hover:text-gray-900 transition-colors py-2 text-sm"
          >
            功能特性
          </a>
          <a
            href="#demo"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-gray-600 hover:text-gray-900 transition-colors py-2 text-sm"
          >
            代码演示
          </a>
          <a
            href="#tech"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-gray-600 hover:text-gray-900 transition-colors py-2 text-sm"
          >
            技术栈
          </a>
          <div className="pt-4 space-y-3">
            {session ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  router.push('/workspace')
                }}
                className="w-full px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-full"
              >
                进入工作台
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    router.push('/login')
                  }}
                  className="w-full px-5 py-2.5 border border-gray-300 text-gray-900 text-sm rounded-full"
                >
                  登录
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    router.push('/register')
                  }}
                  className="w-full px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-full"
                >
                  开始使用
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
