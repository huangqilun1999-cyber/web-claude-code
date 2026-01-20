import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SignJWT } from 'jose'

export const dynamic = 'force-dynamic'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
)

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '请先登录' },
        { status: 401 }
      )
    }

    // 生成WebSocket认证用的JWT
    const token = await new SignJWT({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      // 添加用途标识
      purpose: 'websocket_auth',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h') // Token有效期1小时
      .setAudience('web-claude-code')
      .setIssuer('web-claude-code-api')
      .sign(JWT_SECRET)

    return NextResponse.json({
      token,
      expiresIn: 3600, // 1小时，单位秒
    })
  } catch (error) {
    console.error('Token generation error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: '生成Token失败' },
      { status: 500 }
    )
  }
}

// 刷新Token
export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '请先登录' },
        { status: 401 }
      )
    }

    // 生成新的JWT
    const token = await new SignJWT({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      purpose: 'websocket_auth',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .setAudience('web-claude-code')
      .setIssuer('web-claude-code-api')
      .sign(JWT_SECRET)

    return NextResponse.json({
      token,
      expiresIn: 3600,
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: '刷新Token失败' },
      { status: 500 }
    )
  }
}
