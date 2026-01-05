'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { useEffect } from 'react'
import { BottomNav } from '@/components/BottomNav'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

export default function LeaderboardPage() {
  const router = useRouter()
  const { isLoggedIn } = useAuthStore()

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
            <h1 className="text-lg font-semibold">排行榜</h1>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="max-w-md mx-auto px-6 py-6 space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            本周排行榜
          </h2>

          {/* Top 3 */}
          <div className="space-y-4 mb-6">
            {/* 第1名 */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                1
              </div>
              <Avatar className="w-12 h-12">
                <AvatarImage src={undefined} />
                <AvatarFallback>👤</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">用户A</p>
                <p className="text-sm text-gray-600">减重 2.5 kg</p>
              </div>
            </div>

            {/* 第2名 */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                2
              </div>
              <Avatar className="w-12 h-12">
                <AvatarImage src={undefined} />
                <AvatarFallback>👤</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">用户B</p>
                <p className="text-sm text-gray-600">减重 2.0 kg</p>
              </div>
            </div>

            {/* 第3名 */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                3
              </div>
              <Avatar className="w-12 h-12">
                <AvatarImage src={undefined} />
                <AvatarFallback>👤</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">用户C</p>
                <p className="text-sm text-gray-600">减重 1.8 kg</p>
              </div>
            </div>
          </div>

          {/* 其他排名 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">其他排名</h3>
            {[4, 5, 6, 7, 8].map((rank) => (
              <div
                key={rank}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="w-8 h-8 flex items-center justify-center text-gray-500 font-medium">
                  {rank}
                </div>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={undefined} />
                  <AvatarFallback>👤</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">用户{String.fromCharCode(64 + rank)}</p>
                  <p className="text-xs text-gray-500">减重 {(2.0 - (rank - 1) * 0.2).toFixed(1)} kg</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-center text-gray-500 mt-6">
            排行榜功能开发中...
          </p>
        </Card>
      </main>

      {/* 底部导航栏 */}
      <BottomNav />
    </div>
  )
}

