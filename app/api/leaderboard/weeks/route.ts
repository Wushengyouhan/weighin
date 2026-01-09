import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'
import { getWeekNumber } from '@/lib/week'

/**
 * 获取可用的周列表（从数据库查询最早的周到本周）
 * GET /api/leaderboard/weeks
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

    // 从 rewards 表查询所有已结算的周
    const rewardsWeeks = await db.rewards.findMany({
      select: { week_number: true },
      orderBy: { week_number: 'desc' },
    })

    // 获取所有已结算的周编号（使用 Set 去重）
    const allWeekNumbers = new Set<number>()
    rewardsWeeks.forEach((r) => allWeekNumbers.add(r.week_number))

    // 如果数据库中没有数据，使用默认的最早周 202550
    if (allWeekNumbers.size === 0) {
      allWeekNumbers.add(202550)
    }

    // 转换为数组并排序（最新的在前）
    const weekNumbersArray = Array.from(allWeekNumbers).sort((a, b) => b - a)

    // 生成周列表，过滤掉无效的周数（周数应该在1-53之间）
    const weeks: Array<{ week: number; year: number; weekNumber: number; label: string }> = []
    for (const weekNumber of weekNumbersArray) {
      const year = Math.floor(weekNumber / 100)
      const week = weekNumber % 100
      
      // 过滤掉无效的周数（周数应该在1-53之间）
      if (week >= 1 && week <= 53) {
        weeks.push({
          week,
          year,
          weekNumber,
          label: `${year}年第${week}周`,
        })
      }
    }

    return NextResponse.json({
      code: 200,
      msg: 'success',
      data: {
        weeks,
      },
    })
  } catch (error) {
    console.error('获取周列表失败:', error)
    return NextResponse.json(
      { code: 500, msg: '服务器错误' },
      { status: 500 }
    )
  }
}

