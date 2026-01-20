import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import prisma from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { generateSecretKey } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

const createAgentSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  description: z.string().optional(),
  type: z.enum(['LOCAL', 'SERVER']).default('LOCAL'),
  allowedPaths: z.array(z.string()).optional(),
})

// 获取用户的Agent列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const agents = await prisma.agent.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ agents })
  } catch (error) {
    console.error('Get agents error:', error)
    return NextResponse.json(
      { error: '获取失败' },
      { status: 500 }
    )
  }
}

// 创建新Agent
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const data = createAgentSchema.parse(body)

    const agent = await prisma.agent.create({
      data: {
        userId: session.user.id,
        name: data.name,
        description: data.description,
        type: data.type,
        secretKey: generateSecretKey(),
        allowedPaths: data.allowedPaths || [],
      },
    })

    return NextResponse.json({ agent }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Create agent error:', error)
    return NextResponse.json(
      { error: '创建失败' },
      { status: 500 }
    )
  }
}
