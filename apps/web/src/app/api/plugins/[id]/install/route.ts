import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/db'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// 安装插件
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const plugin = await prisma.plugin.findUnique({
      where: { id: params.id },
    })

    if (!plugin) {
      return NextResponse.json({ error: '插件不存在' }, { status: 404 })
    }

    // 检查是否已安装
    const existingInstall = await prisma.userPlugin.findUnique({
      where: {
        userId_pluginId: {
          userId: session.user.id,
          pluginId: params.id,
        },
      },
    })

    if (existingInstall) {
      return NextResponse.json({ error: '已安装该插件' }, { status: 400 })
    }

    // 安装插件
    await prisma.userPlugin.create({
      data: {
        userId: session.user.id,
        pluginId: params.id,
        isEnabled: true,
      },
    })

    // 增加下载次数
    await prisma.plugin.update({
      where: { id: params.id },
      data: { downloads: { increment: 1 } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Install plugin error:', error)
    return NextResponse.json({ error: '安装失败' }, { status: 500 })
  }
}

// 卸载插件
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    await prisma.userPlugin.deleteMany({
      where: {
        userId: session.user.id,
        pluginId: params.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Uninstall plugin error:', error)
    return NextResponse.json({ error: '卸载失败' }, { status: 500 })
  }
}
