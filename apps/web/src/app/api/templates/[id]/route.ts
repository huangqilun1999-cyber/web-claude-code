import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.template.findUnique({
      where: { id: params.id },
    })

    if (!template) {
      return NextResponse.json({ error: '模板不存在' }, { status: 404 })
    }

    // 增加下载次数
    await prisma.template.update({
      where: { id: params.id },
      data: { downloads: { increment: 1 } },
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Get template error:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}
