import { db } from './db'
import { getWeekNumber } from './week'

/**
 * 结算指定周的排名
 * @param weekNumber 周编号（YYYYWW格式，如 202550）
 * @param force 是否强制重新结算（默认 true），如果为 true 会删除旧数据重新结算，如果为 false 则跳过已结算的周
 * @returns 结算结果
 */
export async function settleWeekRanking(
  weekNumber: number,
  force: boolean = true
): Promise<{
  success: boolean
  message: string
  count?: number
  alreadySettled?: boolean
}> {
  try {
    // 0. 检查是否已经结算过（除非强制重新结算）
    if (!force) {
      const existingRewards = await db.rewards.findFirst({
        where: { week_number: weekNumber },
      })

      if (existingRewards) {
        const count = await db.rewards.count({
          where: { week_number: weekNumber },
        })
        return {
          success: false,
          message: '该周已经结算过',
          alreadySettled: true,
          count,
        }
      }
    }
    
    // 默认强制重新结算：先删除旧的结算记录
    await db.rewards.deleteMany({
      where: { week_number: weekNumber },
    })

    // 1. 获取本周所有打卡记录
    const currentCheckins = await db.checkins.findMany({
      where: { week_number: weekNumber },
    })

    if (currentCheckins.length === 0) {
      return {
        success: false,
        message: '该周没有打卡记录',
        count: 0,
      }
    }

    // 2. 计算每个用户的 weightDiff（只计算上周和本周都有打卡的用户）
    const lastWeekNumber = weekNumber - 1
    const lastCheckins = await db.checkins.findMany({
      where: { week_number: lastWeekNumber },
    })

    // 3. 创建上周打卡用户的 Map（用于快速查找）
    const lastCheckinMap = new Map(
      lastCheckins.map((c) => [c.user_id.toString(), c])
    )

    // 4. 筛选出上周和本周都有打卡的用户
    const eligibleUsers = currentCheckins
      .filter((current) => lastCheckinMap.has(current.user_id.toString()))
      .map((current) => {
        const last = lastCheckinMap.get(current.user_id.toString())!
        return {
          userId: current.user_id,
          weightDiff: Number(last.weight) - Number(current.weight),
          currentWeight: Number(current.weight),
          lastWeight: Number(last.weight),
          checkinTime: current.created_at,
        }
      })

    if (eligibleUsers.length === 0) {
      return {
        success: false,
        message: '该周没有符合条件的用户（上周和本周都有打卡）',
        count: 0,
      }
    }

    // 5. 按 weightDiff 降序排序，如果相同则按打卡时间升序排序
    eligibleUsers.sort((a, b) => {
      if (b.weightDiff !== a.weightDiff) {
        return b.weightDiff - a.weightDiff // 降序
      }
      return a.checkinTime.getTime() - b.checkinTime.getTime() // 升序
    })

    // 6. 分配排名并保存到 rewards 表
    const rewards = []
    for (let i = 0; i < eligibleUsers.length; i++) {
      const user = eligibleUsers[i]
      const rank = i + 1
      const type = rank <= 3 ? rank : 4 // 1=冠军，2=亚军，3=季军，4=参与奖

      const reward = await db.rewards.create({
        data: {
          user_id: user.userId,
          week_number: weekNumber,
          weight_diff: user.weightDiff,
          rank: rank,
          type: type,
          // certificate_url 会在生成奖状后更新（可选）
        },
      })

      rewards.push(reward)
    }

    console.log(`周 ${weekNumber} 结算完成，共 ${rewards.length} 名用户参与排名`)
    return {
      success: true,
      message: '结算成功',
      count: rewards.length,
    }
  } catch (error) {
    console.error(`结算周 ${weekNumber} 失败:`, error)
    throw error
  }
}

/**
 * 启动定时结算任务
 * 每周一 21:00 执行结算
 */
export function startSettlementCron() {
  // 只在服务端执行
  if (typeof window !== 'undefined') {
    return
  }

  // 防止重复启动
  if ((global as any).settlementCronStarted) {
    return
  }

  try {
    const cron = require('node-cron')

    // cron 表达式：每周一 21:00
    // 格式：秒 分 时 日 月 星期
    // 注意：node-cron 使用本地时区
    cron.schedule(
      '0 21 * * 1',
      async () => {
        console.log('开始执行定时结算任务...')
        try {
          const weekNumber = getWeekNumber()
          const result = await settleWeekRanking(weekNumber)
          console.log('定时结算任务完成:', result)
        } catch (error) {
          console.error('定时结算任务失败:', error)
        }
      },
      {
        timezone: 'Asia/Shanghai', // 设置时区为北京时间
      }
    )

    console.log('定时结算任务已启动：每周一 21:00 执行')
    ;(global as any).settlementCronStarted = true
  } catch (error) {
    console.error('启动定时结算任务失败:', error)
  }
}

