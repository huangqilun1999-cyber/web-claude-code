import { jwtVerify, SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
)

export interface TokenPayload {
  id: string
  email: string
  role: string
  name?: string
  purpose?: string
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET, {
    audience: 'web-claude-code',
    issuer: 'web-claude-code-api',
  })
  return payload as unknown as TokenPayload
}

export async function signToken(payload: TokenPayload, expiresIn: string = '7d'): Promise<string> {
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setAudience('web-claude-code')
    .setIssuer('web-claude-code-api')
    .sign(JWT_SECRET)
}
