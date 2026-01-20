import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { generateSecretKey } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

// 重新生成Agent密钥
export async function POST(
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

    const newSecretKey = generateSecretKey()

    const agent = await prisma.agent.update({
      where: { id: params.id },
      data: { secretKey: newSecretKey },
    })

    return NextResponse.json({ agent })
  } catch (error) {
    console.error('Regenerate key error:', error)
    return NextResponse.json(
      { error: '重新生成密钥失败' },
      { status: 500 }
    )
  }
}
