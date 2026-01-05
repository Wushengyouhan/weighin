'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { BottomNav } from '@/components/BottomNav'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingDown,
  Award,
  Download,
  Share2,
  Camera,
  Edit2,
  LogOut,
} from 'lucide-react'

interface UserProfile {
  id: string
  nickname: string | null
  avatar: string | null
}

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

export default function ProfilePage() {
  const router = useRouter()
  const { isLoggedIn, user, logout, setUser } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar || null)
  const [loading, setLoading] = useState(true)
  const [checkinStats, setCheckinStats] = useState<CheckinStats | null>(null)
  const [checkinHistory, setCheckinHistory] = useState<CheckinHistory[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [rewardStats, setRewardStats] = useState<RewardStats | null>(null)
  const [certificates, setCertificates] = useState<Certificate[]>([])

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    fetchUserData()
    fetchCheckins()
    fetchRewards()
  }, [isLoggedIn, router])

  const fetchUserData = async () => {
    try {
      const token = useAuthStore.getState().token
      if (!token) return

      const response = await fetch('/api/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()
      if (result.code === 200) {
        setNickname(result.data.nickname || '')
        setAvatarUrl(result.data.avatar)
        setUser(result.data)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCheckins = async () => {
    try {
      const token = useAuthStore.getState().token
      if (!token) return

      const response = await fetch('/api/user/checkins', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      const token = useAuthStore.getState().token
      if (!token) return

      const response = await fetch('/api/user/rewards', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

      // 上传到 OSS
      const token = useAuthStore.getState().token
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
    try {
      const token = useAuthStore.getState().token
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

  if (!isLoggedIn || loading) {
    return null
  }

  // 计算图表 Y 轴范围
  const weights = chartData.map((d) => d.weight)
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 100
  const yAxisMin = Math.max(0, Math.floor(minWeight - 2))
  const yAxisMax = Math.ceil(maxWeight + 2)

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
            <Avatar className="w-8 h-8">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback>👤</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="max-w-md mx-auto px-6 py-6 space-y-6">
        {/* 个人信息设置板块 */}
        <Card className="p-6">
          <div className="flex items-start gap-6">
            {/* 头像区域 */}
            <div className="relative">
              <Avatar className="w-24 h-24 ring-4 ring-gray-100">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-2xl">👤</AvatarFallback>
              </Avatar>
              {isEditing && (
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
            <div className="flex-1 space-y-4">
              {isEditing ? (
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
                    <p className="text-sm text-gray-500">
                      点击编辑按钮修改个人信息
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      className="gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      编辑资料
                    </Button>
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </Button>
                  </div>
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
                <div className="text-sm text-gray-600 mb-1">累计减重</div>
                <div className="text-3xl text-green-600 mb-1">
                  {checkinStats?.totalWeightLoss || '0.0'} kg
                </div>
                <div className="text-xs text-gray-500">
                  从 {checkinStats?.firstWeight || '0.0'} kg →{' '}
                  {checkinStats?.lastWeight || '0.0'} kg
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
            {chartData.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-blue-600" />
                    体重变化曲线
                  </h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[yAxisMin, yAxisMax]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
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
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div>{record.week}</div>
                        <div className="text-sm text-gray-600">{record.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg">{record.weight} kg</div>
                        {index < checkinHistory.length - 1 && (
                          <div
                            className={`text-sm ${
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
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                  >
                    {/* 奖状图片区域 */}
                    <div
                      className={`h-40 bg-gradient-to-br ${cert.color} flex flex-col items-center justify-center text-white p-4 relative`}
                    >
                      <div className="text-5xl mb-2">
                        {getTrophyEmoji(cert.type)}
                      </div>
                      <div className="text-center">
                        <div className="text-xs opacity-90 mb-1">WeighIn</div>
                        <div className="text-sm">荣誉证书</div>
                      </div>
                      {/* 悬停显示操作按钮 */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="secondary">
                          <Download className="w-4 h-4 mr-1" />
                          保存
                        </Button>
                        <Button size="sm" variant="secondary">
                          <Share2 className="w-4 h-4 mr-1" />
                          分享
                        </Button>
                      </div>
                    </div>

                    {/* 奖状信息 */}
                    <div className="p-3">
                      <div className="text-sm mb-1">{cert.title}</div>
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

            {/* 分享提示 */}
            {certificates.length > 0 && (
              <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <p className="text-sm text-center text-purple-800">
                  💡 点击奖状可以保存到相册或分享到朋友圈
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* 底部导航栏 */}
      <BottomNav />
    </div>
  )
}

