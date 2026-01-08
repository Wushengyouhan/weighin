import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'
import { getWeekMonday } from '@/lib/week'

// 获取荣誉墙数据
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { code: 401, msg: '未登录' },
        { status: 401 }
      )
    }

    // 获取所有奖励记录，按时间倒序
    const rewards = await db.rewards.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    })

    // 统计各类奖励数量
    const stats = {
      champion: 0, // type = 1
      runnerUp: 0, // type = 2
      third: 0, // type = 3
      participant: 0, // type = 4
    }

    // 格式化荣誉墙数据
    const certificates = rewards.map((reward) => {
      const type = Number(reward.type)
      if (type === 1) stats.champion++
      else if (type === 2) stats.runnerUp++
      else if (type === 3) stats.third++
      else if (type === 4) stats.participant++

      const weekNumber = reward.week_number
      const year = Math.floor(weekNumber / 100)
      const week = weekNumber % 100

      let title = ''
      let color = ''
      if (type === 1) {
        title = `${year}年第${week}周冠军`
        color = 'from-yellow-400 to-yellow-600'
      } else if (type === 2) {
        title = `${year}年第${week}周亚军`
        color = 'from-gray-300 to-gray-500'
      } else if (type === 3) {
        title = `${year}年第${week}周季军`
        color = 'from-orange-400 to-orange-600'
      } else {
        title = `${year}年第${week}周参与奖`
        color = 'from-blue-400 to-blue-600'
      }

      // 根据周编号计算该周周一的日期
      const weekMonday = getWeekMonday(weekNumber)
      
      return {
        id: reward.id.toString(),
        type: type === 1 ? 'champion' : type === 2 ? 'runner-up' : type === 3 ? 'third' : 'participant',
        title,
        date: weekMonday.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }),
        color,
        certificateUrl: reward.certificate_url,
        weekNumber: reward.week_number,
      }
    })

    return NextResponse.json({
      code: 200,
      msg: 'success',
      data: {
        stats,
        certificates,
      },
    })
  } catch (error) {
    console.error('获取荣誉墙失败:', error)
    return NextResponse.json(
      { code: 500, msg: '服务器错误' },
      { status: 500 }
    )
  }
}

