'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { Loading } from '@/components/Loading'

export default function Home() {
  const router = useRouter()
  const { isLoggedIn, _hasHydrated } = useAuthStore()

  useEffect(() => {
    // 等待状态恢复完成
    if (!_hasHydrated) {
      return
    }

    if (isLoggedIn) {
      router.push('/home')
    } else {
      router.push('/login')
    }
  }, [isLoggedIn, _hasHydrated, router])

  // 等待状态恢复完成
  if (!_hasHydrated) {
    return <Loading />
  }

  return null
}
