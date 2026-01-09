'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { useEffect, useState, useRef } from 'react'
import { BottomNav } from '@/components/BottomNav'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Loading } from '@/components/Loading'
import { Crown, Award, Medal } from 'lucide-react'
import { createApiHeaders } from '@/lib/api-headers'

interface HallOfFameUser {
  rank: number
  userId: number
  nickname: string
  avatar: string | null
  champion: number
  runnerUp: number
  third: number
  participant: number
  totalScore: number
  totalWeeks: number
}

export default function HallOfFamePage() {
  const router = useRouter()
  const { isLoggedIn, token, user, _hasHydrated } = useAuthStore()
  const [users, setUsers] = useState<HallOfFameUser[]>([])
  const [loading, setLoading] = useState(true)
  const dataFetchedRef = useRef(false)

  useEffect(() => {
    // 等待状态恢复完成
    if (!_hasHydrated) {
      return
    }

    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    // 使用 ref 防止重复调用
    if (!dataFetchedRef.current) {
      dataFetchedRef.current = true
      fetchHallOfFame()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, _hasHydrated])

  const fetchHallOfFame = async () => {
    try {
      setLoading(true)
      if (!token) return

      const response = await fetch('/api/hall-of-fame', {
        headers: createApiHeaders(token),
      })
      const result = await response.json()

      if (result.code === 200) {
        setUsers(result.data.users)
      }
    } catch (error) {
      console.error('获取名人堂失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 等待状态恢复完成
  if (!_hasHydrated) {
    return <Loading />
  }

  if (!isLoggedIn) {
    return null
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center gap-1">
          <Crown className="w-5 h-5 text-yellow-500" />
          <span className="text-yellow-600">殿堂之王</span>
        </div>
      )
    }
    if (rank === 2) {
      return (
        <div className="flex items-center gap-1">
          <Award className="w-5 h-5 text-gray-500" />
          <span className="text-gray-600">名人堂银冠</span>
        </div>
      )
    }
    if (rank === 3) {
      return (
        <div className="flex items-center gap-1">
          <Medal className="w-5 h-5 text-orange-600" />
          <span className="text-orange-600">名人堂铜冠</span>
        </div>
      )
    }
    return <span className="text-gray-500">#{rank}</span>
  }

  const getRankCardStyle = (rank: number) => {
    if (rank === 1) {
      return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300'
    }
    if (rank === 2) {
      return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300'
    }
    if (rank === 3) {
      return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300'
    }
    return 'bg-white'
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
        {/* 顶部标题 */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Crown className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold">名人堂</h1>
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : users.length > 0 ? (
          <>
            {/* Top 3 特殊展示 */}
            <div className="space-y-4">
              {users.slice(0, 3).map((user) => (
                <Card
                  key={user.userId}
                  className={`p-6 border-2 shadow-lg ${getRankCardStyle(user.rank)}`}
                >
                  <div className="space-y-4">
                    {/* 用户信息和排名 */}
                    <div className="flex items-center gap-4">
                      <Avatar
                        className="w-16 h-16 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => router.push(`/profile/${user.userId}`)}
                      >
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback className="text-3xl bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                          {user.nickname[0] || '👤'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-xl font-semibold cursor-pointer hover:underline"
                            onClick={() => router.push(`/profile/${user.userId}`)}
                          >
                            {user.nickname}
                          </span>
                        </div>
                        <div className="text-sm">{getRankBadge(user.rank)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-purple-600">
                          {user.totalScore}
                        </div>
                        <div className="text-xs text-gray-600">总积分</div>
                      </div>
                    </div>

                    {/* 获奖统计 */}
                    <div className="grid grid-cols-4 gap-3 pt-3 border-t">
                      <div className="text-center">
                        <div className="text-2xl mb-1">🥇</div>
                        <div className="text-xl font-bold text-yellow-600">
                          {user.champion}
                        </div>
                        <div className="text-xs text-gray-600">冠军</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl mb-1">🥈</div>
                        <div className="text-xl font-bold text-gray-600">
                          {user.runnerUp}
                        </div>
                        <div className="text-xs text-gray-600">亚军</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl mb-1">🥉</div>
                        <div className="text-xl font-bold text-orange-600">
                          {user.third}
                        </div>
                        <div className="text-xs text-gray-600">季军</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl mb-1">📅</div>
                        <div className="text-xl font-bold text-blue-600">
                          {user.totalWeeks}
                        </div>
                        <div className="text-xs text-gray-600">参与周数</div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Rank 4-5 列表展示 */}
            {users.length > 3 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>其他参与者</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </h3>
                {users.slice(3).map((user) => (
                  <Card
                    key={user.userId}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/profile/${user.userId}`)}
                  >
                    <div className="flex items-center gap-3">
                      {/* 排名 */}
                      <div className="w-8 text-center text-gray-500 font-medium">
                        #{user.rank}
                      </div>

                      {/* 头像 */}
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                          {user.nickname[0] || '👤'}
                        </AvatarFallback>
                      </Avatar>

                      {/* 用户信息 */}
                      <div className="flex-1">
                        <div className="mb-1 font-medium text-gray-900 hover:underline">
                          {user.nickname}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <span>🥇 {user.champion}</span>
                          <span>🥈 {user.runnerUp}</span>
                          <span>🥉 {user.third}</span>
                        </div>
                      </div>

                      {/* 总积分 */}
                      <div className="text-right">
                        <div className="text-xl font-bold text-purple-600">
                          {user.totalScore}
                        </div>
                        <div className="text-xs text-gray-500">积分</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <Card className="p-6">
            <p className="text-center text-gray-500">暂无名人堂数据</p>
          </Card>
        )}

        {/* 底部说明 */}
        <Card className="p-4 bg-gray-50">
          <p className="text-xs text-gray-600 text-center mb-2">
            💡 名人堂根据历史所有周期的排名综合计算，展示最具毅力的挑战者
          </p>
          <p className="text-xs text-gray-500 text-center">
            积分规则：🥇 冠军 = 5分 | 🥈 亚军 = 3分 | 🥉 季军 = 2分 | 📅 参与奖 = 1分
          </p>
        </Card>
      </main>

      {/* 底部导航栏 */}
      <BottomNav />
    </div>
  )
}

