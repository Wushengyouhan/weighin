import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

/**
 * 获取名人堂数据（历史前5名用户）
 * GET /api/hall-of-fame
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

    // 查询所有奖励记录，关联用户信息
    const rewards = await db.rewards.findMany({
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

    // 按用户分组统计
    const userStatsMap = new Map<
      string,
      {
        userId: number
        nickname: string
        avatar: string | null
        champion: number
        runnerUp: number
        third: number
        participant: number
        totalWeeks: number
        totalScore: number
      }
    >()

    // 积分计算规则
    const getScore = (type: number): number => {
      switch (type) {
        case 1:
          return 5 // 冠军
        case 2:
          return 3 // 亚军
        case 3:
          return 2 // 季军
        case 4:
          return 1 // 参与奖
        default:
          return 0
      }
    }

    // 统计每个用户的积分和获奖次数
    for (const reward of rewards) {
      const userIdStr = reward.user_id.toString()
      const user = reward.users

      if (!userStatsMap.has(userIdStr)) {
        userStatsMap.set(userIdStr, {
          userId: Number(reward.user_id),
          nickname: user.nickname || `用户${reward.user_id}`,
          avatar: user.avatar,
          champion: 0,
          runnerUp: 0,
          third: 0,
          participant: 0,
          totalWeeks: 0,
          totalScore: 0,
        })
      }

      const stats = userStatsMap.get(userIdStr)!
      stats.totalWeeks++

      // 统计各类奖励数量
      switch (reward.type) {
        case 1:
          stats.champion++
          break
        case 2:
          stats.runnerUp++
          break
        case 3:
          stats.third++
          break
        case 4:
          stats.participant++
          break
      }

      // 累加积分
      stats.totalScore += getScore(reward.type)
    }

    // 转换为数组并排序
    const users = Array.from(userStatsMap.values()).sort((a, b) => {
      // 先按总积分降序
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore
      }
      // 如果积分相同，按参与周数降序
      if (b.totalWeeks !== a.totalWeeks) {
        return b.totalWeeks - a.totalWeeks
      }
      // 如果都相同，按用户ID升序（保证排序稳定）
      return a.userId - b.userId
    })

    // 取前5名
    const top5 = users.slice(0, 5).map((user, index) => ({
      rank: index + 1,
      userId: user.userId,
      nickname: user.nickname,
      avatar: user.avatar,
      champion: user.champion,
      runnerUp: user.runnerUp,
      third: user.third,
      participant: user.participant,
      totalScore: user.totalScore,
      totalWeeks: user.totalWeeks,
    }))

    return NextResponse.json({
      code: 200,
      msg: 'success',
      data: {
        users: top5,
      },
    })
  } catch (error) {
    console.error('获取名人堂失败:', error)
    return NextResponse.json(
      { code: 500, msg: '服务器错误' },
      { status: 500 }
    )
  }
}

