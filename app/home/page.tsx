'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BottomNav } from '@/components/BottomNav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { FlipCountdown } from '@/components/FlipCountdown'
import { Loading } from '@/components/Loading'
import { Trophy, TrendingDown, Timer } from 'lucide-react'
import { getTimeUntilDeadline, getDaysUntilNextCheckIn } from '@/lib/week'

interface CheckInStatus {
  status: 'unchecked' | 'checked' | 'closed'
  weekNumber: number
  checkInOpen: boolean
  checkin: {
    id: string
    weight: number
    weekNumber: number
  } | null
}

export default function HomePage() {
  const router = useRouter()
  const { isLoggedIn, user, _hasHydrated } = useAuthStore()
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus | null>(null)
  const [timeUntilDeadline, setTimeUntilDeadline] = useState(0)
  const [daysUntilNext, setDaysUntilNext] = useState(0)

  useEffect(() => {
    // 等待状态恢复完成
    if (!_hasHydrated) {
      return
    }

    if (!isLoggedIn) {
      router.push('/login')
    } else {
      fetchCheckInStatus()
      updateCountdown()
      const timer = setInterval(updateCountdown, 1000)
      return () => clearInterval(timer)
    }
  }, [isLoggedIn, _hasHydrated, router])

  const fetchCheckInStatus = async () => {
    try {
      const token = useAuthStore.getState().token
      if (!token) return

      const { createApiHeaders } = await import('@/lib/api-headers')
      const response = await fetch('/api/checkin/status', {
        headers: createApiHeaders(token),
      })
      const result = await response.json()
      if (result.code === 200) {
        setCheckInStatus(result.data)
        setDaysUntilNext(getDaysUntilNextCheckIn())
      }
    } catch (error) {
      console.error('获取打卡状态失败:', error)
    }
  }

  const updateCountdown = () => {
    const timeLeft = getTimeUntilDeadline()
    setTimeUntilDeadline(timeLeft)
    setDaysUntilNext(getDaysUntilNextCheckIn())
  }

  // 等待状态恢复完成
  if (!_hasHydrated) {
    return <Loading />
  }

  if (!isLoggedIn) {
    return null
  }

  // 计算倒计时（小时和分钟）
  const hours = Math.floor(timeUntilDeadline / (1000 * 60 * 60))
  const minutes = Math.floor((timeUntilDeadline % (1000 * 60 * 60)) / (1000 * 60))

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* 顶部导航栏 */}
      <header className="border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <span className="text-xl font-semibold">WeighIn</span>
            </div>
            <button
              onClick={() => router.push('/profile')}
              className="flex items-center"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar || undefined} />
                <AvatarFallback>👤</AvatarFallback>
              </Avatar>
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="max-w-md mx-auto px-6 py-6 space-y-6">
        {/* 顶部 Banner */}
        <Card className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg border-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">WeighIn</h1>
              <p className="opacity-90">坚持每周，遇见更好的自己</p>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <Trophy className="w-8 h-8" />
            </div>
          </div>
        </Card>

        {/* 核心状态卡片 */}
        <Card className="p-6 shadow-md">
          {checkInStatus?.status === 'unchecked' && (
            <div className="text-center space-y-6">
              <div className="space-y-3">
                <p className="text-gray-900 text-base font-semibold">本次打卡倒计时</p>
                <FlipCountdown hours={hours} minutes={minutes} />
              </div>
              <Button
                onClick={() => router.push('/checkin')}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                size="lg"
              >
                立即打卡
              </Button>
            </div>
          )}

          {checkInStatus?.status === 'checked' && checkInStatus.checkin && (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-2">
                <div className="text-3xl">✅</div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">打卡成功！</h2>
              <p className="text-gray-600 text-lg">
                本周体重：{checkInStatus.checkin.weight.toFixed(2)} kg
              </p>
              <p className="text-sm text-gray-500">
                已提交，等待今晚 21:00 结算
              </p>
              <Button
                onClick={() => router.push('/profile')}
                variant="outline"
                className="w-full"
              >
                查看我的记录
              </Button>
            </div>
          )}

          {checkInStatus?.status === 'closed' && (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-2">
                <Timer className="w-8 h-8 text-gray-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">⏳ 打卡已关闭</h2>
              <p className="text-gray-600">
                距离下一次打卡还有{' '}
                <span className="text-2xl font-bold text-purple-600">{daysUntilNext}</span> 天
              </p>
              <Button
                onClick={() => router.push('/leaderboard')}
                variant="outline"
                className="w-full"
              >
                查看本周排行榜
              </Button>
            </div>
          )}

          {!checkInStatus && (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          )}
        </Card>

        {/* 快捷入口 */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-900">快捷入口</h3>
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-2">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">名人堂</p>
            </Card>
            <Card
              className="p-4 text-center cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push('/profile')}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-2">
                <TrendingDown className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">体重趋势</p>
            </Card>
            <Card
              className="p-4 text-center cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push('/profile?tab=honors')}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-2">
                <div className="text-2xl">🏆</div>
              </div>
              <p className="text-sm font-medium text-gray-700">荣誉墙</p>
            </Card>
          </div>
        </div>
      </main>

      {/* 底部导航栏 */}
      <BottomNav />
    </div>
  )
}
