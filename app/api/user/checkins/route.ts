import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

// 获取打卡历史和统计数据
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { code: 401, msg: '未登录' },
        { status: 401 }
      )
    }

    // 获取所有打卡记录，按时间倒序
    const checkins = await db.checkins.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    })

    // 计算统计数据
    let totalWeightLoss = 0
    let firstWeight: number | null = null
    let lastWeight: number | null = null
    const weekCount = checkins.length

    if (checkins.length > 0) {
      // 按时间正序排列，获取第一个和最后一个
      const sortedCheckins = [...checkins].sort(
        (a, b) => a.created_at.getTime() - b.created_at.getTime()
      )
      firstWeight = Number(sortedCheckins[0].weight)
      lastWeight = Number(sortedCheckins[sortedCheckins.length - 1].weight)
      totalWeightLoss = firstWeight - lastWeight
    }

    // 计算平均每周减重
    const avgWeeklyLoss = weekCount > 0 ? totalWeightLoss / weekCount : 0

    // 格式化打卡历史数据
    const history = checkins.map((checkin, index) => {
      const prevCheckin = index < checkins.length - 1 ? checkins[index + 1] : null
      const weightDiff = prevCheckin
        ? Number(checkin.weight) - Number(prevCheckin.weight)
        : 0

      // 从 week_number 解析年份和周数
      const weekNumber = checkin.week_number
      const year = Math.floor(weekNumber / 100)
      const week = weekNumber % 100

      return {
        id: checkin.id.toString(),
        week: `${year}年第${week}周`,
        weekNumber: checkin.week_number,
        weight: Number(checkin.weight),
        photoUrl: checkin.photo_url,
        date: new Date(checkin.created_at).toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }),
        weightDiff,
        createdAt: checkin.created_at,
      }
    })

    // 生成图表数据（按时间正序）
    const chartData = [...checkins]
      .sort((a, b) => a.created_at.getTime() - b.created_at.getTime())
      .map((checkin) => {
        const weekNumber = checkin.week_number
        const year = Math.floor(weekNumber / 100)
        const week = weekNumber % 100

        return {
          week: `${year}年第${week}周`,
          weight: Number(checkin.weight),
          date: new Date(checkin.created_at).toLocaleDateString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
          }),
        }
      })

    return NextResponse.json({
      code: 200,
      msg: 'success',
      data: {
        stats: {
          totalWeightLoss: totalWeightLoss.toFixed(1),
          firstWeight: firstWeight?.toFixed(1) || '0',
          lastWeight: lastWeight?.toFixed(1) || '0',
          weekCount,
          avgWeeklyLoss: avgWeeklyLoss.toFixed(2),
        },
        history,
        chartData,
      },
    })
  } catch (error) {
    console.error('获取打卡历史失败:', error)
    return NextResponse.json(
      { code: 500, msg: '服务器错误' },
      { status: 500 }
    )
  }
}

