'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { useEffect, useState, useRef } from 'react'
import { BottomNav } from '@/components/BottomNav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/Loading'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, Upload, X, Scale } from 'lucide-react'
import { isCheckInOpen } from '@/lib/week'

export default function CheckinPage() {
  const router = useRouter()
  const { isLoggedIn, _hasHydrated } = useAuthStore()
  const [weight, setWeight] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFirstWeek, setIsFirstWeek] = useState(false)
  const [lastWeekWeight, setLastWeekWeight] = useState<number | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasCheckedTimeRef = useRef(false)

  useEffect(() => {
    // 等待状态恢复完成
    if (!_hasHydrated) {
      return
    }

    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    // 检查打卡时间（只检查一次，避免重复弹窗）
    if (!hasCheckedTimeRef.current) {
      hasCheckedTimeRef.current = true
      if (!isCheckInOpen()) {
        alert('打卡时间已结束，请等待下次打卡时间')
        router.push('/home')
        return
      }
    }

    // 获取历史打卡数据
    fetchCheckinHistory()
  }, [isLoggedIn, _hasHydrated, router])

  const fetchCheckinHistory = async () => {
    try {
      const token = useAuthStore.getState().token
      if (!token) return

      const { createApiHeaders } = await import('@/lib/api-headers')
      const response = await fetch('/api/user/checkins', {
        headers: createApiHeaders(token),
      })
      const result = await response.json()
      if (result.code === 200) {
        const history = result.data.history
        setIsFirstWeek(history.length === 0)
        if (history.length > 0 && history[0]) {
          const lastCheckin = history[0]
          setLastWeekWeight(lastCheckin.weight)
        }
      }
    } catch (error) {
      console.error('获取打卡历史失败:', error)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('只能上传图片文件')
        return
      }

      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        alert('图片大小不能超过 10MB')
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    setImageFile(null)
  }

  const handleSubmit = async () => {
    if (!weight) {
      alert('请输入体重')
      return
    }

    const weightNum = parseFloat(weight)
    if (isNaN(weightNum) || weightNum < 30 || weightNum > 200) {
      alert('请输入有效的体重（30-200 kg）')
      return
    }

    if (!imageFile) {
      alert('请上传照片')
      return
    }

    setIsSubmitting(true)

    try {
      const token = useAuthStore.getState().token
      if (!token) {
        alert('未登录，请重新登录')
        return
      }

      const formData = new FormData()
      formData.append('weight', weightNum.toString())
      formData.append('photo', imageFile)

      const { createApiHeaders } = await import('@/lib/api-headers')
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: createApiHeaders(token),
        body: formData,
      })

      const result = await response.json()

      if (result.code === 200) {
        alert('打卡成功！')
        router.push('/home')
      } else {
        alert(result.msg || '打卡失败')
      }
    } catch (error) {
      console.error('打卡失败:', error)
      alert('打卡失败，请稍后再试')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 计算预计变化
  const weightDiff = lastWeekWeight && weight
    ? parseFloat(weight) - lastWeekWeight
    : null

  // 等待状态恢复完成
  if (!_hasHydrated) {
    return <Loading />
  }

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
            <h1 className="text-lg font-semibold">打卡</h1>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="max-w-md mx-auto px-6 py-6 space-y-6">
        {/* 顶部提示 */}
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div className="flex-1 text-sm">
              <p className="mb-1">
                每周一 00:00 - 20:00 开放打卡，21:00 自动结算排名
              </p>
              {isFirstWeek && (
                <div className="mt-2 inline-block px-2 py-1 bg-orange-500 text-white text-xs rounded">
                  首次打卡将作为基准体重，下周开始计算排名
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* 体重输入 */}
        <Card className="p-6 shadow-md">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">输入体重</h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">本周体重（千克）</Label>
              <div className="relative">
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="例如：68.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="text-2xl h-14 pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                  kg
                </span>
              </div>
            </div>

            {!isFirstWeek && lastWeekWeight && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">上次体重</span>
                  <span className="font-medium">{lastWeekWeight.toFixed(2)} kg</span>
                </div>
                {weight && weightDiff !== null && (
                  <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-200">
                    <span className="text-gray-600">预计变化</span>
                    <span
                      className={
                        weightDiff < 0
                          ? 'text-green-600 font-medium'
                          : weightDiff > 0
                            ? 'text-red-600 font-medium'
                            : 'text-gray-600 font-medium'
                      }
                    >
                      {weightDiff < 0 ? '↓' : weightDiff > 0 ? '↑' : '—'}{' '}
                      {Math.abs(weightDiff).toFixed(1)} kg
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* 照片上传 */}
        <Card className="p-6 shadow-md">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Camera className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">上传照片凭证</h2>
            </div>

            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Upload className="w-8 h-8 text-gray-600" />
                </div>
                <p className="mb-4 text-gray-600">上传体重秤照片作为凭证</p>
                <div className="flex gap-3 justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4" />
                    拍照上传
                  </Button>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    相册选择
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={imagePreview}
                    alt="预览"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* 提交按钮 */}
        <Button
          onClick={handleSubmit}
          disabled={!weight || !imageFile || isSubmitting}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
          size="lg"
        >
          {isSubmitting ? '提交中...' : '提交打卡'}
        </Button>
      </main>

      {/* 底部导航栏 */}
      <BottomNav />
    </div>
  )
}
