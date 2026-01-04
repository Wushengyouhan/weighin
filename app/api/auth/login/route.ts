import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/auth'

// 验证手机号格式
function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, code } = body

    // 验证输入
    if (!phone || !validatePhone(phone)) {
      return NextResponse.json(
        { code: 400, msg: '请输入正确的手机号' },
        { status: 400 }
      )
    }

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { code: 400, msg: '请输入6位验证码' },
        { status: 400 }
      )
    }

    // 查找有效的验证码
    const now = new Date()
    const verificationCode = await db.verificationCode.findFirst({
      where: {
        phone,
        code,
        expiresAt: {
          gt: now,
        },
        used: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!verificationCode) {
      return NextResponse.json(
        { code: 400, msg: '验证码无效或已过期' },
        { status: 400 }
      )
    }

    // 标记验证码为已使用
    await db.verificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true },
    })

    // 查询该手机号是否已存在
    const userAuth = await db.userAuth.findUnique({
      where: {
        identityType_identifier: {
          identityType: 'phone',
          identifier: phone,
        },
      },
      include: {
        user: true,
      },
    })

    let userId: bigint
    let isNewUser: boolean
    let user: { id: bigint; nickname: string | null; avatar: string | null }

    if (userAuth) {
      // 老用户：更新最后登录时间
      await db.userAuth.update({
        where: { id: userAuth.id },
        data: { lastLoginAt: new Date() },
      })

      userId = userAuth.userId
      isNewUser = false
      user = {
        id: userAuth.user.id,
        nickname: userAuth.user.nickname,
        avatar: userAuth.user.avatar,
      }
    } else {
      // 新用户：自动注册
      // 使用事务确保数据一致性
      const result = await db.$transaction(async (tx) => {
        // 创建用户
        const newUser = await tx.user.create({
          data: {},
        })

        // 创建用户授权记录
        await tx.userAuth.create({
          data: {
            userId: newUser.id,
            identityType: 'phone',
            identifier: phone,
            lastLoginAt: new Date(),
          },
        })

        return newUser
      })

      userId = result.id
      isNewUser = true
      user = {
        id: result.id,
        nickname: result.nickname,
        avatar: result.avatar,
      }
    }

    // 生成 JWT Token（永久有效）
    const token = generateToken(userId)

    return NextResponse.json({
      code: 200,
      msg: 'success',
      data: {
        token,
        is_new_user: isNewUser,
        user: {
          id: user.id.toString(),
          nickname: user.nickname,
          avatar: user.avatar,
        },
      },
    })
  } catch (error) {
    console.error('登录失败:', error)
    return NextResponse.json(
      { code: 500, msg: '服务器错误，请稍后再试' },
      { status: 500 }
    )
  }
}

