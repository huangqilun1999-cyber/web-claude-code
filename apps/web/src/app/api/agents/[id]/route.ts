import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import prisma from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { generateSecretKey } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

const updateAgentSchema = z.object({
  name: z.string().min(1, '名称不能为空').optional(),
  description: z.string().optional(),
  type: z.enum(['LOCAL', 'SERVER']).optional(),
  allowedPaths: z.array(z.string()).optional(),
})

// 获取单个Agent
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const agent = await prisma.agent.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent不存在' }, { status: 404 })
    }

    return NextResponse.json({ agent })
  } catch (error) {
    console.error('Get agent error:', error)
    return NextResponse.json(
      { error: '获取失败' },
      { status: 500 }
    )
  }
}

// 更新Agent
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 验证Agent属于当前用户
    const existingAgent = await prisma.agent.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingAgent) {
      return NextResponse.json({ error: 'Agent不存在' }, { status: 404 })
    }

    const body = await request.json()
    const data = updateAgentSchema.parse(body)

    const agent = await prisma.agent.update({
      where: { id: params.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type && { type: data.type }),
        ...(data.allowedPaths && { allowedPaths: data.allowedPaths }),
      },
    })

    return NextResponse.json({ agent })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Update agent error:', error)
    return NextResponse.json(
      { error: '更新失败' },
      { status: 500 }
    )
  }
}

// 删除Agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 验证Agent属于当前用户
    const existingAgent = await prisma.agent.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingAgent) {
      return NextResponse.json({ error: 'Agent不存在' }, { status: 404 })
    }

    await prisma.agent.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete agent error:', error)
    return NextResponse.json(
      { error: '删除失败' },
      { status: 500 }
    )
  }
}
