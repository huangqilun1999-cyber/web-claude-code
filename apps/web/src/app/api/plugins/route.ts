import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/db'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// 获取插件列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const where: any = { isActive: true }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const plugins = await prisma.plugin.findMany({
      where,
      orderBy: [{ isOfficial: 'desc' }, { downloads: 'desc' }],
    })

    // 如果用户已登录，获取已安装的插件
    let installedPluginIds: string[] = []
    if (session?.user?.id) {
      const userPlugins = await prisma.userPlugin.findMany({
        where: { userId: session.user.id },
        select: { pluginId: true },
      })
      installedPluginIds = userPlugins.map((up: { pluginId: string }) => up.pluginId)
    }

    const pluginsWithInstallStatus = plugins.map((plugin: { id: string }) => ({
      ...plugin,
      isInstalled: installedPluginIds.includes(plugin.id),
    }))

    return NextResponse.json({ plugins: pluginsWithInstallStatus })
  } catch (error) {
    console.error('Get plugins error:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}
