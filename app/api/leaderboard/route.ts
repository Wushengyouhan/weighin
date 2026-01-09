import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'
import { getWeekNumber } from '@/lib/week'

/**
 * 获取排行榜数据
 * GET /api/leaderboard?week=50&year=2025
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { code: 401, msg: '未登录' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const weekParam = searchParams.get('week')
    const yearParam = searchParams.get('year')

    // 计算 weekNumber
    let weekNumber: number
    if (weekParam && yearParam) {
      const week = parseInt(weekParam)
      const year = parseInt(yearParam)
      if (isNaN(week) || isNaN(year) || week < 1 || week > 53) {
        return NextResponse.json(
          { code: 400, msg: '无效的周数或年份参数' },
          { status: 400 }
        )
      }
      weekNumber = year * 100 + week
    } else if (weekParam) {
      const week = parseInt(weekParam)
      if (isNaN(week) || week < 1 || week > 53) {
        return NextResponse.json(
          { code: 400, msg: '无效的周数参数' },
          { status: 400 }
        )
      }
      const currentYear = new Date().getFullYear()
      weekNumber = currentYear * 100 + week
    } else {
      // 默认查询当前周
      weekNumber = getWeekNumber()
    }

    const year = Math.floor(weekNumber / 100)
    const week = weekNumber % 100

    // 查询该周的奖励记录（已结算的数据）
    const rewards = await db.rewards.findMany({
      where: { week_number: weekNumber },
      orderBy: { rank: 'asc' },
      include: {
        users: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    })

    // 检查是否已结算
    const settled = rewards.length > 0
    let settledAt: string | null = null
    if (settled && rewards[0]) {
      settledAt = rewards[0].created_at.toISOString()
    }

    // 如果没有结算数据，返回空列表
    if (!settled) {
      return NextResponse.json({
        code: 200,
        msg: 'success',
        data: {
          week,
          weekNumber,
          year,
          settled: false,
          settledAt: null,
          users: [],
        },
      })
    }

    // 组装排行榜数据
    const users = rewards.map((reward) => {
      return {
        rank: reward.rank,
        userId: Number(reward.user_id),
        nickname: reward.users.nickname || `用户${reward.user_id}`,
        avatar: reward.users.avatar,
        weightDiff: Number(reward.weight_diff),
      }
    })

    return NextResponse.json({
      code: 200,
      msg: 'success',
      data: {
        week,
        weekNumber,
        year,
        settled,
        settledAt,
        users,
      },
    })
  } catch (error) {
    console.error('获取排行榜失败:', error)
    return NextResponse.json(
      { code: 500, msg: '服务器错误' },
      { status: 500 }
    )
  }
}

