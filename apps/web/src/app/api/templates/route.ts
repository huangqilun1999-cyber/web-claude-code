import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/db'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// 获取模板列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const where: any = { isPublic: true }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: [{ isOfficial: 'desc' }, { downloads: 'desc' }],
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Get templates error:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

// 创建模板
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, category, config } = body

    const template = await prisma.template.create({
      data: {
        name,
        description,
        category,
        config,
        authorId: session.user.id,
        author: session.user.name || session.user.email,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
