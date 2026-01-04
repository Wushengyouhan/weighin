import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// 生成6位随机验证码
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// 验证手机号格式
function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = body

    // 验证手机号格式
    if (!phone || !validatePhone(phone)) {
      return NextResponse.json(
        { code: 400, msg: '请输入正确的手机号' },
        { status: 400 }
      )
    }

    // 防刷检查：检查该手机号60秒内是否已发送过验证码
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
    const recentCode = await db.verificationCode.findFirst({
      where: {
        phone,
        createdAt: {
          gte: oneMinuteAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (recentCode) {
      return NextResponse.json(
        { code: 429, msg: '验证码发送过于频繁，请稍后再试' },
        { status: 429 }
      )
    }

    // 生成6位验证码
    const code = generateCode()

    // 计算过期时间（5分钟后）
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    // 存入数据库
    await db.verificationCode.create({
      data: {
        phone,
        code,
        expiresAt,
        used: false,
      },
    })

    // 返回验证码（模拟短信发送，实际应该调用短信服务）
    return NextResponse.json({
      code: 200,
      msg: '验证码已发送',
      data: {
        code, // 开发阶段返回验证码，方便测试
      },
    })
  } catch (error) {
    console.error('发送验证码失败:', error)
    return NextResponse.json(
      { code: 500, msg: '服务器错误，请稍后再试' },
      { status: 500 }
    )
  }
}

