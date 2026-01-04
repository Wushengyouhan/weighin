'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'

export default function Home() {
  const router = useRouter()
  const { isLoggedIn } = useAuthStore()

  useEffect(() => {
    if (isLoggedIn) {
      router.push('/home')
    } else {
      router.push('/login')
    }
  }, [isLoggedIn, router])

  return null
}
