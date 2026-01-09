import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

/**
 * 获取指定用户信息
 * GET /api/user/profile/[userId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    // 验证当前用户是否登录
    const currentUserId = getUserIdFromRequest(request)
    if (!currentUserId) {
      return NextResponse.json(
        { code: 401, msg: '未登录' },
        { status: 401 }
      )
    }

    // 处理 params 可能是 Promise 的情况
    const resolvedParams = await Promise.resolve(params)
    const targetUserId = parseInt(resolvedParams.userId)
    if (isNaN(targetUserId)) {
      return NextResponse.json(
        { code: 400, msg: '无效的用户ID' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { code: 404, msg: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      code: 200,
      msg: 'success',
      data: {
        id: user.id.toString(),
        nickname: user.nickname,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return NextResponse.json(
      { code: 500, msg: '服务器错误' },
      { status: 500 }
    )
  }
}

