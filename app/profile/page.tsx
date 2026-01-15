'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'

export default function ProfilePage() {
  const router = useRouter()
  const { isLoggedIn, user, _hasHydrated } = useAuthStore()

  useEffect(() => {
    // 等待状态恢复完成
    if (!_hasHydrated) {
      return
    }

    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    // 重定向到动态路由
    if (user?.id) {
      router.replace(`/profile/${user.id}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, _hasHydrated, user?.id])

  // 等待重定向
  return null
}

