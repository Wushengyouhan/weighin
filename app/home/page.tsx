'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const router = useRouter()
  const { isLoggedIn, user, logout } = useAuthStore()

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login')
    }
  }, [isLoggedIn, router])

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 顶部导航栏 */}
      <header className="border-b border-gray-100">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <span className="text-xl font-semibold">WeighIn</span>
            </div>
            <button
              onClick={() => {
                logout()
                router.push('/login')
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="max-w-md mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">欢迎回来！</h1>
          <p className="text-gray-600 mb-8">
            {user?.nickname || `用户 ${user?.id}`}
          </p>
          <div className="bg-gray-50 rounded-lg p-8">
            <p className="text-gray-500">主页内容待开发...</p>
          </div>
        </div>
      </main>
    </div>
  )
}

