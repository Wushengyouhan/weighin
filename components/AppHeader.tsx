'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface AppHeaderProps {
  rightContent?: React.ReactNode
}

export function AppHeader({ rightContent }: AppHeaderProps) {
  const router = useRouter()
  const { user } = useAuthStore()

  return (
    <header className="border-b border-gray-100 sticky top-0 bg-white z-10">
      <div className="max-w-md mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <span className="text-xl font-semibold">WeighIn</span>
          </div>
          {rightContent || (
            <button
              onClick={() => user?.id && router.push(`/profile/${user.id}`)}
              className="flex items-center"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar || undefined} />
                <AvatarFallback>👤</AvatarFallback>
              </Avatar>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

