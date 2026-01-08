import { NextRequest, NextResponse } from 'next/server'
import { settleWeekRanking } from '@/lib/settlement'
import { getWeekNumber } from '@/lib/week'

/**
 * 结算排名接口
 * POST /api/admin/settle?week=50&year=2025&force=false
 */
export async function POST(request: NextRequest) {
  try {
    // 可选：验证管理员权限
    const authHeader = request.headers.get('authorization')
    const adminSecret = process.env.ADMIN_SECRET

    if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { code: 401, msg: '无权限' },
        { status: 401 }
      )
    }

    // 获取要结算的周数（可选参数）
    const { searchParams } = new URL(request.url)
    const weekParam = searchParams.get('week')
    const yearParam = searchParams.get('year')
    const forceParam = searchParams.get('force')

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
      // 默认结算当前周
      weekNumber = getWeekNumber()
    }

    // 默认强制重新结算，除非明确指定 force=false
    const force = forceParam !== 'false'

    const result = await settleWeekRanking(weekNumber, force)

    if (result.success) {
      return NextResponse.json({
        code: 200,
        msg: result.message,
        data: {
          weekNumber,
          count: result.count,
        },
      })
    } else {
      return NextResponse.json(
        {
          code: result.alreadySettled ? 400 : 404,
          msg: result.message,
          data: {
            weekNumber,
            alreadySettled: result.alreadySettled,
            count: result.count,
          },
        },
        { status: result.alreadySettled ? 400 : 404 }
      )
    }
  } catch (error: any) {
    console.error('手动结算失败:', error)
    return NextResponse.json(
      { code: 500, msg: error.message || '结算失败' },
      { status: 500 }
    )
  }
}

