'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { BottomNav } from '@/components/BottomNav'
import { AppHeader } from '@/components/AppHeader'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loading } from '@/components/Loading'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts'
import {
  TrendingDown,
  Award,
  Camera,
  Edit2,
  LogOut,
  ArrowLeft,
} from 'lucide-react'
import { createApiHeaders } from '@/lib/api-headers'

interface CheckinStats {
  totalWeightLoss: string
  firstWeight: string
  lastWeight: string
  weekCount: number
  avgWeeklyLoss: string
}

interface CheckinHistory {
  id: string
  week: string
  weekNumber: number
  weight: number
  photoUrl: string
  date: string
  weightDiff: number
  createdAt: Date
}

interface ChartData {
  week: string
  weight: number
  date: string
}

interface RewardStats {
  champion: number
  runnerUp: number
  third: number
  participant: number
}

interface Certificate {
  id: string
  type: 'champion' | 'runner-up' | 'third' | 'participant'
  title: string
  date: string
  color: string
  certificateUrl: string | null
  weekNumber: number
}

export default function UserProfilePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params?.userId as string
  const { isLoggedIn, user, logout, setUser, token, _hasHydrated } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [nickname, setNickname] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkinStats, setCheckinStats] = useState<CheckinStats | null>(null)
  const [checkinHistory, setCheckinHistory] = useState<CheckinHistory[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [rewardStats, setRewardStats] = useState<RewardStats | null>(null)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null)
  const dataFetchedRef = useRef(false)

  // 判断是否是查看自己的页面
  const isOwnProfile = user?.id === userId

  useEffect(() => {
    // 等待状态恢复完成
    if (!_hasHydrated) {
      return
    }

    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    if (!userId) {
      router.push('/profile')
      return
    }

    // 使用 ref 防止重复调用
    if (!dataFetchedRef.current) {
      dataFetchedRef.current = true
      fetchUserData()
      fetchCheckins()
      fetchRewards()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, _hasHydrated, userId])

  const fetchUserData = async () => {
    try {
      if (!token || !userId) return

      const response = await fetch(`/api/user/profile/${userId}`, {
        headers: createApiHeaders(token),
      })
      const result = await response.json()
      if (result.code === 200) {
        setNickname(result.data.nickname || '')
        setAvatarUrl(result.data.avatar)
        // 如果是自己的页面，更新 store 中的用户信息
        if (isOwnProfile) {
          setUser(result.data)
        }
      } else if (result.code === 404) {
        alert('用户不存在')
        router.push('/home')
      } else if (result.code === 400) {
        alert(result.msg || '无效的用户ID')
        router.push('/home')
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      alert('获取用户信息失败，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  const fetchCheckins = async () => {
    try {
      if (!token || !userId) return

      const response = await fetch(`/api/user/checkins/${userId}`, {
        headers: createApiHeaders(token),
      })
      const result = await response.json()
      if (result.code === 200) {
        setCheckinStats(result.data.stats)
        setCheckinHistory(result.data.history)
        setChartData(result.data.chartData)
      }
    } catch (error) {
      console.error('获取打卡历史失败:', error)
    }
  }

  const fetchRewards = async () => {
    try {
      if (!token || !userId) return

      const response = await fetch(`/api/user/rewards/${userId}`, {
        headers: createApiHeaders(token),
      })
      const result = await response.json()
      if (result.code === 200) {
        setRewardStats(result.data.stats)
        setCertificates(result.data.certificates)
      }
    } catch (error) {
      console.error('获取荣誉墙失败:', error)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwnProfile) return

    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('只能上传图片文件')
      return
    }

    // 验证文件大小（5MB）
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert('图片大小不能超过 5MB')
      return
    }

    try {
      // 先显示本地预览
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string)
      }
      reader.readAsDataURL(file)

      if (!token) {
        alert('未登录，请重新登录')
        return
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const result = await response.json()
      if (result.code === 200) {
        // 使用 OSS 返回的 URL
        setAvatarUrl(result.data.url)
      } else {
        alert(result.msg || '上传失败')
        // 恢复原始头像
        setAvatarUrl(user?.avatar || null)
      }
    } catch (error) {
      console.error('上传失败:', error)
      alert('上传失败，请稍后再试')
      // 恢复原始头像
      setAvatarUrl(user?.avatar || null)
    }
  }

  const handleSave = async () => {
    if (!isOwnProfile) return

    try {
      if (!token) {
        alert('未登录，请重新登录')
        return
      }

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nickname: nickname || null,
          avatar: avatarUrl || null,
        }),
      })
      const result = await response.json()
      if (result.code === 200) {
        setUser(result.data)
        setIsEditing(false)
        alert('个人信息已保存')
        // 重新获取用户数据
        fetchUserData()
      } else {
        alert(result.msg || '保存失败')
      }
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请稍后再试')
    }
  }

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout()
      router.push('/login')
    }
  }

  const getTrophyEmoji = (type: string) => {
    if (type === 'champion') return '🥇'
    if (type === 'runner-up') return '🥈'
    if (type === 'third') return '🥉'
    return '🎖️'
  }


  // 等待状态恢复完成
  if (!_hasHydrated) {
    return <Loading />
  }

  if (!isLoggedIn || loading) {
    return null
  }

  // 处理图表数据：显示最近12周的数据
  const getProcessedChartData = () => {
    if (checkinHistory.length === 0) return []

    const sortedHistory = [...checkinHistory].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    // 获取所有唯一的周
    const weekMap = new Map<string, { weekNumber: number; weight: number; date: Date }>()
    sortedHistory.forEach((item) => {
      const weekKey = item.week
      if (!weekMap.has(weekKey) || item.weight > 0) {
        weekMap.set(weekKey, {
          weekNumber: item.weekNumber,
          weight: item.weight,
          date: new Date(item.createdAt),
        })
      }
    })

    // 转换为数组并按周编号排序，取最近12周
    const weeks = Array.from(weekMap.values())
      .sort((a, b) => a.weekNumber - b.weekNumber)
      .slice(-12) // 只显示最近12周

    return weeks.map((item) => {
      const weekNumber = item.weekNumber
      const year = Math.floor(weekNumber / 100)
      const week = weekNumber % 100
      return {
        label: `${year}W${week}`,
        weight: item.weight,
        date: item.date,
      }
    })
  }

  const processedChartData = getProcessedChartData()

  // 计算图表 Y 轴范围
  const weights = processedChartData.map((d) => d.weight).filter((w) => w > 0)
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 100
  const yAxisMin = Math.max(0, Math.floor(minWeight - 2))
  const yAxisMax = Math.ceil(maxWeight + 2)

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* 顶部导航栏 */}
      <AppHeader />

      {/* 主内容区域 */}
      <main className="max-w-md mx-auto px-6 py-6 space-y-6">
        {/* 个人信息设置板块 */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-start gap-4 sm:gap-6">
            {/* 头像区域 */}
            <div className="relative">
              <Avatar className="w-24 h-24 ring-4 ring-gray-100">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-2xl">👤</AvatarFallback>
              </Avatar>
              {isEditing && isOwnProfile && (
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors shadow-lg"
                >
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
              )}
            </div>

            {/* 昵称和操作区域 */}
            <div className="flex-1 space-y-4 min-w-0">
              {isEditing && isOwnProfile ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nickname">昵称</Label>
                    <Input
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="请输入昵称"
                      className="text-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} className="flex-1">
                      保存
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false)
                        setNickname(user?.nickname || '')
                        setAvatarUrl(user?.avatar || null)
                      }}
                    >
                      取消
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h2 className="text-2xl font-semibold mb-1">
                      {nickname || '用户昵称'}
                    </h2>
                    {!isOwnProfile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.back()}
                        className="mt-2 gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        返回
                      </Button>
                    )}
                    {isOwnProfile && (
                      <p className="text-sm text-gray-500">
                        点击编辑按钮修改个人信息
                      </p>
                    )}
                  </div>
                  {isOwnProfile && (
                    <div className="flex gap-1.5 min-w-0">
                      <Button
                        onClick={() => setIsEditing(true)}
                        variant="outline"
                        className="flex-1 gap-1 text-xs px-2 h-8 min-w-0"
                        size="sm"
                      >
                        <Edit2 className="w-3 h-3 shrink-0" />
                        <span className="truncate">编辑</span>
                      </Button>
                      <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="flex-1 gap-1 text-xs px-2 h-8 min-w-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        size="sm"
                      >
                        <LogOut className="w-3 h-3 shrink-0" />
                        <span className="truncate">退出</span>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>

        <Tabs defaultValue="trend" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="trend" className="gap-2">
              <TrendingDown className="w-4 h-4" />
              体重趋势
            </TabsTrigger>
            <TabsTrigger value="honors" className="gap-2">
              <Award className="w-4 h-4" />
              荣誉墙
            </TabsTrigger>
          </TabsList>

          {/* 体重趋势图 */}
          <TabsContent value="trend" className="space-y-6">
            {/* 统计卡片 */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="text-sm text-gray-600 mb-1">
                  {(() => {
                    const loss = parseFloat(checkinStats?.totalWeightLoss || '0')
                    if (loss > 0) return '体重总共减少'
                    if (loss < 0) return '体重总共增加'
                    return '体重无变化'
                  })()}
                </div>
                <div
                  className={`text-3xl mb-1 ${
                    (() => {
                      const loss = parseFloat(checkinStats?.totalWeightLoss || '0')
                      if (loss > 0) return 'text-green-600'
                      if (loss < 0) return 'text-red-600'
                      return 'text-gray-600'
                    })()
                  }`}
                >
                  {(() => {
                    const loss = parseFloat(checkinStats?.totalWeightLoss || '0')
                    if (loss === 0) return '0.00'
                    return Math.abs(loss).toFixed(2)
                  })()}{' '}
                  kg
                </div>
                <div className="text-xs text-gray-500">
                  从 {checkinStats?.firstWeight || '0.00'} kg →{' '}
                  {checkinStats?.lastWeight || '0.00'} kg
                </div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="text-sm text-gray-600 mb-1">参与周数</div>
                <div className="text-3xl text-purple-600 mb-1">
                  {checkinStats?.weekCount || 0} 周
                </div>
                <div className="text-xs text-gray-500">
                  平均每周减重{' '}
                  {checkinStats?.avgWeeklyLoss || '0.00'} kg
                </div>
              </Card>
            </div>

            {/* 趋势图 */}
            {checkinHistory.length > 0 && (
              <Card className="p-6">
                <div className="mb-4">
                  <h3 className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-blue-600" />
                    体重变化曲线
                  </h3>
                </div>

                {processedChartData.length > 0 && (
                  <ChartContainer
                    config={{
                      weight: {
                        label: '体重',
                        color: '#22c55e',
                      },
                    }}
                    className="h-[300px] w-full"
                  >
                    <AreaChart data={processedChartData}>
                      <defs>
                        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-weight)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--color-weight)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        className="text-xs text-muted-foreground"
                        ticks={processedChartData.length > 0 ? [
                          processedChartData[0].label,
                          processedChartData[processedChartData.length - 1].label
                        ] : []}
                      />
                      <YAxis
                        domain={[yAxisMin, yAxisMax]}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={2}
                        width={30}
                        className="text-xs text-muted-foreground"
                        tickFormatter={(value) => `${value}`}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            indicator="dot"
                            formatter={(value) => {
                              const numValue = typeof value === 'number' ? value : parseFloat(String(value))
                              return numValue > 0 ? [`${numValue.toFixed(1)} kg`, '体重'] : ['暂无数据', '体重']
                            }}
                          />
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="weight"
                        stroke="var(--color-weight)"
                        fill="url(#weightGradient)"
                        strokeWidth={2.5}
                        dot={{ 
                          fill: 'white', 
                          stroke: 'var(--color-weight)', 
                          strokeWidth: 2,
                          r: 4 
                        }}
                        activeDot={{ r: 6 }}
                      />
                    </AreaChart>
                  </ChartContainer>
                )}
              </Card>
            )}

            {/* 历史记录列表 */}
            {checkinHistory.length > 0 && (
              <Card className="p-4">
                <h3 className="mb-4">打卡历史</h3>
                <div className="space-y-2">
                  {checkinHistory.map((record, index) => (
                    <div
                      key={record.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      {/* 照片缩略图 */}
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
                        <img
                          src={record.photoUrl}
                          alt={`${record.week}打卡照片`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* 信息区域 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium">{record.week}</div>
                          <div className="text-lg font-semibold">{record.weight.toFixed(2)} kg</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">{record.date}</div>
                          {index < checkinHistory.length - 1 && (
                            <div
                              className={`text-sm font-medium ${
                                record.weightDiff < 0
                                  ? 'text-green-600'
                                  : record.weightDiff > 0
                                    ? 'text-red-600'
                                    : 'text-gray-500'
                              }`}
                            >
                              {record.weightDiff < 0
                                ? '↓'
                                : record.weightDiff > 0
                                  ? '↑'
                                  : '—'}{' '}
                              {Math.abs(record.weightDiff).toFixed(1)} kg
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {checkinHistory.length === 0 && (
              <Card className="p-8 text-center text-gray-500">
                暂无打卡记录
              </Card>
            )}
          </TabsContent>

          {/* 荣誉墙 */}
          <TabsContent value="honors" className="space-y-6">
            {/* 成就统计 */}
            {rewardStats && (
              <div className="grid grid-cols-4 gap-2">
                <Card className="p-3 text-center bg-gradient-to-br from-yellow-50 to-yellow-100">
                  <div className="text-2xl mb-1">🥇</div>
                  <div className="text-xl">{rewardStats.champion}</div>
                  <div className="text-xs text-gray-600">冠军</div>
                </Card>
                <Card className="p-3 text-center bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="text-2xl mb-1">🥈</div>
                  <div className="text-xl">{rewardStats.runnerUp}</div>
                  <div className="text-xs text-gray-600">亚军</div>
                </Card>
                <Card className="p-3 text-center bg-gradient-to-br from-orange-50 to-orange-100">
                  <div className="text-2xl mb-1">🥉</div>
                  <div className="text-xl">{rewardStats.third}</div>
                  <div className="text-xs text-gray-600">季军</div>
                </Card>
                <Card className="p-3 text-center bg-gradient-to-br from-blue-50 to-blue-100">
                  <div className="text-2xl mb-1">🎖️</div>
                  <div className="text-xl">{rewardStats.participant}</div>
                  <div className="text-xs text-gray-600">参与</div>
                </Card>
              </div>
            )}

            {/* 奖状网格 */}
            {certificates.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {certificates.map((cert) => (
                  <Card
                    key={cert.id}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group p-0"
                  >
                    {/* 奖状图片区域 */}
                    <div 
                      className="relative aspect-square w-full overflow-hidden bg-gray-100 cursor-pointer"
                      onClick={() => setPreviewCert(cert)}
                    >
                      {cert.certificateUrl ? (
                        <img
                          src={cert.certificateUrl}
                          alt={cert.title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div
                          className={`h-full bg-gradient-to-br ${cert.color} flex flex-col items-center justify-center text-white p-4`}
                        >
                          <div className="text-5xl mb-2">
                            {getTrophyEmoji(cert.type)}
                          </div>
                          <div className="text-center">
                            <div className="text-xs opacity-90 mb-1">WeighIn</div>
                            <div className="text-sm">荣誉证书</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 奖状信息 */}
                    <div className="px-3 py-1.5">
                      <div className="text-sm font-medium mb-0.5">{cert.title}</div>
                      <div className="text-xs text-gray-500">{cert.date}</div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center text-gray-500">
                暂无荣誉记录
              </Card>
            )}

            {/* 保存提示 */}
            {certificates.length > 0 && (
              <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <p className="text-sm text-center text-purple-800">
                  💡 点击奖状可以保存到相册
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* 底部导航栏 */}
      <BottomNav />

      {/* 预览对话框 */}
      <Dialog open={!!previewCert} onOpenChange={(open) => !open && setPreviewCert(null)}>
        <DialogContent className="max-w-4xl p-4">
          <DialogHeader>
            <DialogTitle>{previewCert?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center">
            {previewCert?.certificateUrl ? (
              <img
                src={previewCert.certificateUrl}
                alt={previewCert.title}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            ) : (
              <div
                className={`w-full aspect-square bg-gradient-to-br ${previewCert?.color} flex flex-col items-center justify-center text-white p-8 rounded-lg`}
              >
                <div className="text-8xl mb-4">
                  {previewCert && getTrophyEmoji(previewCert.type)}
                </div>
                <div className="text-center">
                  <div className="text-lg opacity-90 mb-2">WeighIn</div>
                  <div className="text-xl">荣誉证书</div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

