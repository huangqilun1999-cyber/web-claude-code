import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import prisma from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { encrypt } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

const apiKeySchema = z.object({
  apiKey: z.string().min(1, 'API Key不能为空'),
})

// 设置API Key
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { apiKey } = apiKeySchema.parse(body)

    const { encrypted, iv } = encrypt(apiKey)

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        apiKeyEncrypted: encrypted,
        apiKeyIv: iv,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Set API key error:', error)
    return NextResponse.json(
      { error: '设置失败' },
      { status: 500 }
    )
  }
}

// 检查API Key状态
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        apiKeyEncrypted: true,
      },
    })

    return NextResponse.json({
      hasApiKey: !!user?.apiKeyEncrypted,
    })
  } catch (error) {
    console.error('Get API key status error:', error)
    return NextResponse.json(
      { error: '获取失败' },
      { status: 500 }
    )
  }
}

// 删除API Key
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        apiKeyEncrypted: null,
        apiKeyIv: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete API key error:', error)
    return NextResponse.json(
      { error: '删除失败' },
      { status: 500 }
    )
  }
}
