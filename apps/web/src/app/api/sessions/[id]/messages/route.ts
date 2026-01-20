import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import prisma from '@/lib/db'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const createMessageSchema = z.object({
  role: z.enum(['USER', 'ASSISTANT', 'SYSTEM', 'TOOL']),
  content: z.string().min(1, '消息内容不能为空'),
  contentType: z.enum(['TEXT', 'CODE', 'IMAGE', 'FILE', 'ERROR']).optional().default('TEXT'),
  metadata: z.record(z.any()).optional(),
})

const createBulkMessagesSchema = z.object({
  messages: z.array(createMessageSchema),
})

// 获取会话的所有消息
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
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const order = searchParams.get('order') === 'desc' ? 'desc' : 'asc'

    // 验证会话属于当前用户
    const chatSession = await prisma.session.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!chatSession) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 })
    }

    const messages = await prisma.message.findMany({
      where: {
        sessionId: params.id,
      },
      orderBy: { createdAt: order },
      take: limit,
      skip: offset,
    })

    const total = await prisma.message.count({
      where: { sessionId: params.id },
    })

    return NextResponse.json({ messages, total })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: '获取失败' },
      { status: 500 }
    )
  }
}

// 添加单条消息
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 验证会话属于当前用户
    const chatSession = await prisma.session.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!chatSession) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 })
    }

    const body = await request.json()
    const data = createMessageSchema.parse(body)

    const message = await prisma.message.create({
      data: {
        sessionId: params.id,
        role: data.role,
        content: data.content,
        contentType: data.contentType,
        metadata: data.metadata || {},
      },
    })

    // 更新会话的 updatedAt
    await prisma.session.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Create message error:', error)
    return NextResponse.json(
      { error: '创建失败' },
      { status: 500 }
    )
  }
}

// 批量添加消息
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 验证会话属于当前用户
    const chatSession = await prisma.session.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!chatSession) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 })
    }

    const body = await request.json()
    const data = createBulkMessagesSchema.parse(body)

    // 批量创建消息
    const createdMessages = await prisma.message.createMany({
      data: data.messages.map((msg) => ({
        sessionId: params.id,
        role: msg.role,
        content: msg.content,
        contentType: msg.contentType || 'TEXT',
        metadata: msg.metadata || {},
      })),
    })

    // 更新会话的 updatedAt
    await prisma.session.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({ count: createdMessages.count }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Create bulk messages error:', error)
    return NextResponse.json(
      { error: '批量创建失败' },
      { status: 500 }
    )
  }
}

// 清空会话消息
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
    const chatSession = await prisma.session.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!chatSession) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 })
    }

    const result = await prisma.message.deleteMany({
      where: { sessionId: params.id },
    })

    return NextResponse.json({ deleted: result.count })
  } catch (error) {
    console.error('Delete messages error:', error)
    return NextResponse.json(
      { error: '删除失败' },
      { status: 500 }
    )
  }
}
