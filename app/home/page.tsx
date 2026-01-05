'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { BottomNav } from '@/components/BottomNav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Camera, Trophy, TrendingDown, Award } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { isLoggedIn, user } = useAuthStore()

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login')
    }
  }, [isLoggedIn, router])

  if (!isLoggedIn) {
    return null
  }

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
        {/* 欢迎卡片 */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 ring-4 ring-white">
              <AvatarImage src={user?.avatar || undefined} />
              <AvatarFallback className="text-2xl">👤</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                欢迎回来！
              </h1>
              <p className="text-gray-600">
                {user?.nickname || `用户 ${user?.id}`}
              </p>
            </div>
          </div>
        </Card>

        {/* 本周状态卡片 */}
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                本周挑战
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                距离下一次打卡还有 X 天
              </p>
            </div>
            <Button
              onClick={() => router.push('/checkin')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
              size="lg"
            >
              <Camera className="w-5 h-5 mr-2" />
              立即打卡
            </Button>
          </div>
        </Card>

        {/* 快捷入口 */}
        <div className="grid grid-cols-2 gap-4">
          <Card
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/leaderboard')}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">排行榜</span>
            </div>
          </Card>

          <Card
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/profile')}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">体重趋势</span>
            </div>
          </Card>

          <Card
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/profile')}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">荣誉墙</span>
            </div>
          </Card>

          <Card
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/profile')}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={user?.avatar || undefined} />
                  <AvatarFallback className="text-xs">👤</AvatarFallback>
                </Avatar>
              </div>
              <span className="text-sm font-medium text-gray-700">我的</span>
            </div>
          </Card>
        </div>

        {/* 上周战况 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            上周战况
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">用户A</p>
                <p className="text-xs text-gray-500">减重 2.5 kg</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">用户B</p>
                <p className="text-xs text-gray-500">减重 2.0 kg</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">用户C</p>
                <p className="text-xs text-gray-500">减重 1.8 kg</p>
              </div>
            </div>
          </div>
        </Card>
      </main>

      {/* 底部导航栏 */}
      <BottomNav />
    </div>
  )
}

