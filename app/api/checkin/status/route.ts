import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'
import { getWeekNumber, isCheckInOpen } from '@/lib/week'
import { getCurrentDate } from '@/lib/time-mock-server'

// 获取打卡状态
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { code: 401, msg: '未登录' },
        { status: 401 }
      )
    }

    const mockDate = getCurrentDate(request.headers)
    const currentWeekNumber = getWeekNumber(mockDate)
    const checkInOpen = isCheckInOpen(mockDate)

    // 查询本周是否已打卡
    const currentWeekCheckin = await db.checkins.findFirst({
      where: {
        user_id: userId,
        week_number: currentWeekNumber,
      },
    })

    // 判断打卡状态
    let status: 'unchecked' | 'checked' | 'closed'
    if (checkInOpen) {
      status = currentWeekCheckin ? 'checked' : 'unchecked'
    } else {
      status = 'closed'
    }

    return NextResponse.json({
      code: 200,
      msg: 'success',
      data: {
        status,
        weekNumber: currentWeekNumber,
        checkInOpen,
        checkin: currentWeekCheckin
          ? {
              id: currentWeekCheckin.id.toString(),
              weight: Number(currentWeekCheckin.weight),
              weekNumber: currentWeekCheckin.week_number,
            }
          : null,
      },
    })
  } catch (error) {
    console.error('获取打卡状态失败:', error)
    return NextResponse.json(
      { code: 500, msg: '服务器错误' },
      { status: 500 }
    )
  }
}

