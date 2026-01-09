'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { useEffect, useState } from 'react'
import { BottomNav } from '@/components/BottomNav'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loading } from '@/components/Loading'
import { Trophy, TrendingDown, Crown, Medal, Clock } from 'lucide-react'
import { getWeekNumber, getWeekMonday } from '@/lib/week'
import { createApiHeaders } from '@/lib/api-headers'

interface LeaderboardData {
  week: number
  weekNumber: number
  year: number
  settled: boolean
  settledAt: string | null
  users: Array<{
    rank: number
    userId: number
    nickname: string
    avatar: string | null
    weightDiff: number
  }>
}

export default function LeaderboardPage() {
  const router = useRouter()
  const { isLoggedIn, token, _hasHydrated } = useAuthStore()
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [availableWeeks, setAvailableWeeks] = useState<Array<{ week: number; year: number; weekNumber: number; label: string }>>([])

  useEffect(() => {
    // 等待状态恢复完成
    if (!_hasHydrated) {
      return
    }

    if (!isLoggedIn) {
      router.push('/login')
    } else {
      fetchAvailableWeeks()
      fetchLeaderboard()
    }
  }, [isLoggedIn, _hasHydrated, router])

  const fetchAvailableWeeks = async () => {
    try {
      if (!token) return

      const response = await fetch('/api/leaderboard/weeks', {
        headers: createApiHeaders(token),
      })
      const result = await response.json()
      
      if (result.code === 200) {
        const weeks = result.data.weeks
        
        // 直接使用从数据库查询到的周列表，不进行过滤
        setAvailableWeeks(weeks)
        
        // 如果没有选择周，默认选择第一个（最新的周）
        if (!selectedWeek && weeks.length > 0) {
          setSelectedWeek(weeks[0].week)
          setSelectedYear(weeks[0].year)
        }
      }
    } catch (error) {
      console.error('获取周列表失败:', error)
    }
  }

  useEffect(() => {
    if (isLoggedIn && _hasHydrated && availableWeeks.length > 0) {
      // 如果没有选择周，默认选择第一个（最新的周）
      if (!selectedWeek && availableWeeks[0]) {
        setSelectedWeek(availableWeeks[0].week)
        setSelectedYear(availableWeeks[0].year)
      } else if (selectedWeek) {
        fetchLeaderboard(selectedWeek, selectedYear)
      }
    }
  }, [selectedWeek, selectedYear, isLoggedIn, _hasHydrated, availableWeeks])

  const fetchLeaderboard = async (week?: number, year?: number) => {
    try {
      setLoading(true)
      if (!token) return

      const params = new URLSearchParams()
      if (week) params.append('week', week.toString())
      if (year) params.append('year', year.toString())

      const response = await fetch(`/api/leaderboard?${params.toString()}`, {
        headers: createApiHeaders(token),
      })
      const result = await response.json()
      
      if (result.code === 200) {
        setData(result.data)
      }
    } catch (error) {
      console.error('获取排行榜失败:', error)
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

  // 计算结算时间提示
  const getSettlementTimeText = () => {
    if (!data) return ''
    
    if (data.settled && data.settledAt) {
      const settledDate = new Date(data.settledAt)
      return `结算时间：${settledDate.toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })}`
    } else {
      // 计算本周结算时间（下周一 21:00）
      const weekMonday = getWeekMonday(data.weekNumber)
      const nextMonday = new Date(weekMonday)
      nextMonday.setDate(weekMonday.getDate() + 7)
      nextMonday.setHours(21, 0, 0, 0)
      
      const weekDay = nextMonday.toLocaleDateString('zh-CN', { weekday: 'short' })
      return `本周结算时间：${nextMonday.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit'
      })}（${weekDay}）21:00`
    }
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
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h1 className="text-lg font-semibold">排行榜</h1>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="max-w-md mx-auto px-6 py-6 space-y-4">
        {/* 周期选择器 */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">排行榜</h2>
          </div>
          <Select
            value={selectedWeek ? `${selectedYear}-${selectedWeek}` : availableWeeks[0] ? `${availableWeeks[0].year}-${availableWeeks[0].week}` : ''}
            onValueChange={(value) => {
              const [year, week] = value.split('-').map(Number)
              setSelectedWeek(week)
              setSelectedYear(year)
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择周期" />
            </SelectTrigger>
            <SelectContent>
              {availableWeeks.map((w) => (
                <SelectItem key={`${w.year}-${w.week}`} value={`${w.year}-${w.week}`}>
                  {w.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 结算时间提示 */}
        {data && (
          <Card className="p-3 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <Clock className="w-4 h-4" />
              <p className="text-center flex-1">{getSettlementTimeText()}</p>
            </div>
          </Card>
        )}

        {loading ? (
          <Loading />
        ) : data && data.users.length > 0 ? (
          <>
            {/* Top 3 特殊展示 */}
            <div className="space-y-3">
              {data.users.slice(0, 3).map((user) => (
                <TopThreeCard key={user.userId} user={user} rank={user.rank} />
              ))}
            </div>

            {/* Rank 4+ 列表展示 */}
            {data.users.length > 3 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>其他参与者</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </h3>
                {data.users.slice(3).map((user) => (
                  <RankCard key={user.userId} user={user} />
                ))}
              </div>
            )}
          </>
        ) : (
          <Card className="p-6">
            <p className="text-center text-gray-500">
              {data?.settled ? '该周暂无排行榜数据' : '等待结算（每周一 21:00 自动结算）'}
            </p>
          </Card>
        )}

        {/* 底部说明 */}
        <Card className="p-4 bg-gray-50">
          <p className="text-xs text-center text-gray-600">
            排名根据（上周体重 - 本周体重）计算，减重越多排名越高。只有上周和本周都有打卡的用户才能参与排名。
          </p>
        </Card>
      </main>

      {/* 底部导航栏 */}
      <BottomNav />
    </div>
  )
}

// Top 3 卡片组件
function TopThreeCard({ user, rank }: { user: LeaderboardData['users'][0], rank: number }) {
  const router = useRouter()
  
  const config = {
    1: {
      bg: 'from-yellow-50 to-yellow-100',
      badge: 'from-yellow-400 to-yellow-600',
      icon: Crown,
      title: '冠军',
      iconColor: 'text-yellow-600',
    },
    2: {
      bg: 'from-gray-50 to-gray-100',
      badge: 'from-gray-300 to-gray-500',
      icon: Medal,
      title: '亚军',
      iconColor: 'text-gray-500',
    },
    3: {
      bg: 'from-orange-50 to-orange-100',
      badge: 'from-orange-400 to-orange-600',
      icon: Medal,
      title: '季军',
      iconColor: 'text-orange-600',
    },
  }[rank]

  const Icon = config.icon

  return (
    <Card className={`p-5 bg-gradient-to-br ${config.bg} shadow-lg`}>
      <div className="flex items-center gap-4">
        {/* 排名图标 */}
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 bg-gradient-to-br ${config.badge} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
            {rank}
          </div>
        </div>

        {/* 头像 */}
        <Avatar 
          className="w-14 h-14 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/profile/${user.userId}`)}
        >
          <AvatarImage src={user.avatar || undefined} />
          <AvatarFallback className="text-2xl">{user.nickname[0] || '👤'}</AvatarFallback>
        </Avatar>

        {/* 用户信息 */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p 
              className="font-semibold text-gray-900 cursor-pointer hover:underline"
              onClick={() => router.push(`/profile/${user.userId}`)}
            >
              {user.nickname}
            </p>
            <Badge className={`${rank === 1 ? 'bg-yellow-600' : rank === 2 ? 'bg-gray-600' : 'bg-orange-700'} text-white border-0`}>
              {config.title}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TrendingDown className="w-4 h-4" />
            <span>减重 {user.weightDiff.toFixed(1)} kg</span>
          </div>
        </div>

        {/* 奖状图标 */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-white/20 rounded border-2 border-white/40 flex items-center justify-center">
            <Trophy className={`w-6 h-6 ${config.iconColor}`} />
          </div>
        </div>
      </div>
    </Card>
  )
}

// Rank 4+ 卡片组件
function RankCard({ user }: { user: LeaderboardData['users'][0] }) {
  const router = useRouter()

  return (
    <Card 
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => router.push(`/profile/${user.userId}`)}
    >
      <div className="flex items-center gap-3">
        {/* 排名 */}
        <div className="w-8 text-center text-gray-500 font-medium">
          #{user.rank}
        </div>

        {/* 头像 */}
        <Avatar className="w-10 h-10">
          <AvatarImage src={user.avatar || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
            {user.nickname[0] || '👤'}
          </AvatarFallback>
        </Avatar>

        {/* 用户信息 */}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 hover:underline">
            {user.nickname}
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <TrendingDown className="w-3 h-3" />
            <span>减重 {user.weightDiff.toFixed(1)} kg</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
