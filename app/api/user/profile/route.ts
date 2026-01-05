import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

// 获取用户信息
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { code: 401, msg: '未登录' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
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

// 更新用户信息
export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { code: 401, msg: '未登录' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nickname, avatar } = body

    const updateData: { nickname?: string; avatar?: string } = {}
    if (nickname !== undefined) {
      updateData.nickname = nickname || null
    }
    if (avatar !== undefined) {
      updateData.avatar = avatar || null
    }

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        nickname: true,
        avatar: true,
      },
    })

    return NextResponse.json({
      code: 200,
      msg: '更新成功',
      data: {
        id: user.id.toString(),
        nickname: user.nickname,
        avatar: user.avatar,
      },
    })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    return NextResponse.json(
      { code: 500, msg: '服务器错误' },
      { status: 500 }
    )
  }
}

