'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { useEffect } from 'react'
import { BottomNav } from '@/components/BottomNav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CheckinPage() {
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
            <h1 className="text-lg font-semibold">打卡</h1>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="max-w-md mx-auto px-6 py-6">
        <Card className="p-6">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">本周打卡</h2>
              <p className="text-sm text-gray-500">记录您的体重变化</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">体重 (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="请输入体重"
                step="0.1"
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label>照片凭证</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-sm text-gray-500 mb-4">点击上传照片</p>
                <Button variant="outline">选择照片</Button>
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
              size="lg"
            >
              提交打卡
            </Button>

            <p className="text-xs text-center text-gray-500">
              打卡功能开发中...
            </p>
          </div>
        </Card>
      </main>

      {/* 底部导航栏 */}
      <BottomNav />
    </div>
  )
}

