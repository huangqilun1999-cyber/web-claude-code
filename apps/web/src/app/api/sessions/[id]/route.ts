import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import prisma from '@/lib/db'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const updateSessionSchema = z.object({
  name: z.string().min(1, '会话名称不能为空').optional(),
  agentId: z.string().nullable().optional(),
  workingDirectory: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DELETED']).optional(),
})

// 获取单个会话（包含消息）
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeMessages = searchParams.get('messages') === 'true'
    const messageLimit = parseInt(searchParams.get('messageLimit') || '50')

    const chatSession = await prisma.session.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            isOnline: true,
            type: true,
          },
        },
        ...(includeMessages && {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: messageLimit,
          },
        }),
      },
    })

    if (!chatSession) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 })
    }

    // 反转消息顺序，使最早的在前
    if (includeMessages && chatSession.messages) {
      chatSession.messages.reverse()
    }

    return NextResponse.json({ session: chatSession })
  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json(
      { error: '获取失败' },
      { status: 500 }
    )
  }
}

// 更新会话
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 验证会话属于当前用户
    const existingSession = await prisma.session.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingSession) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 })
    }

    const body = await request.json()
    const data = updateSessionSchema.parse(body)

    // 如果更新agentId，验证Agent属于当前用户
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

    const updatedSession = await prisma.session.update({
      where: { id: params.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.agentId !== undefined && { agentId: data.agentId }),
        ...(data.workingDirectory && { workingDirectory: data.workingDirectory }),
        ...(data.status && { status: data.status }),
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

    return NextResponse.json({ session: updatedSession })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Update session error:', error)
    return NextResponse.json(
      { error: '更新失败' },
      { status: 500 }
    )
  }
}

// 删除会话（软删除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 验证会话属于当前用户
    const existingSession = await prisma.session.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingSession) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 })
    }

    // 软删除
    await prisma.session.update({
      where: { id: params.id },
      data: { status: 'DELETED' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete session error:', error)
    return NextResponse.json(
      { error: '删除失败' },
      { status: 500 }
    )
  }
}
