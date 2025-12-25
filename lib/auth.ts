import { NextRequest } from 'next/server'
import * as jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface JWTPayload {
  userId: string
  iat?: number
}

/**
 * 生成 JWT Token（永久有效，不设置过期时间）
 */
export function generateToken(userId: bigint | number): string {
  const payload: JWTPayload = {
    userId: userId.toString(),
  }
  
  return jwt.sign(payload, JWT_SECRET)
}

/**
 * 验证 JWT Token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * 从请求头中获取 Token
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

/**
 * 从请求中获取用户 ID
 */
export function getUserIdFromRequest(request: NextRequest): bigint | null {
  const token = getTokenFromRequest(request)
  if (!token) return null
  
  const payload = verifyToken(token)
  if (!payload) return null
  
  return BigInt(payload.userId)
}

