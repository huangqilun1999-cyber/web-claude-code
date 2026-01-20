import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { WebSocketProvider } from '@/lib/websocket'
import { DashboardHeader } from '@/components/layout/header'
import { DashboardSidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <WebSocketProvider>
      <div className="h-screen flex flex-col bg-white dark:bg-gray-950">
        <DashboardHeader />
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop sidebar - hidden on mobile */}
          <div className="hidden md:block">
            <DashboardSidebar />
          </div>
          {/* Main content - add bottom padding for mobile nav */}
          <main className="flex-1 overflow-hidden pb-16 md:pb-0">
            {children}
          </main>
        </div>
        {/* Mobile bottom navigation */}
        <BottomNav />
      </div>
    </WebSocketProvider>
  )
}
