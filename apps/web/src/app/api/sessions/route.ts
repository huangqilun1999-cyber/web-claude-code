import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import prisma from '@/lib/db'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const createSessionSchema = z.object({
  name: z.string().min(1, '会话名称不能为空').optional(),
  agentId: z.string().optional(),
  workingDirectory: z.string().optional(),
})

// 获取用户的会话列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'ACTIVE'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const sessions = await prisma.session.findMany({
      where: {
        userId: session.user.id,
        status: status as any,
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            isOnline: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await prisma.session.count({
      where: {
        userId: session.user.id,
        status: status as any,
      },
    })

    return NextResponse.json({ sessions, total })
  } catch (error) {
    console.error('Get sessions error:', error)
    return NextResponse.json(
      { error: '获取失败' },
      { status: 500 }
    )
  }
}

// 创建新会话
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const data = createSessionSchema.parse(body)

    // 如果指定了agentId，验证Agent属于当前用户
    if (data.agentId) {
      const agent = await prisma.agent.findFirst({
        where: {
          id: data.agentId,
          userId: session.user.id,
        },
      })

      if (!agent) {
        return NextResponse.json({ error: 'Agent不存在' }, { status: 404 })
      }
    }

    const newSession = await prisma.session.create({
      data: {
        userId: session.user.id,
        name: data.name || '新会话',
        agentId: data.agentId,
        workingDirectory: data.workingDirectory,
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            isOnline: true,
          },
        },
      },
    })

    return NextResponse.json({ session: newSession }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Create session error:', error)
    return NextResponse.json(
      { error: '创建失败' },
      { status: 500 }
    )
  }
}
