import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  nickname: string | null
  avatar: string | null
}

interface AuthState {
  token: string | null
  user: User | null
  isLoggedIn: boolean
  login: (token: string, user: User) => void
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoggedIn: false,
      login: (token, user) => set({ token, user, isLoggedIn: true }),
      logout: () => set({ token: null, user: null, isLoggedIn: false }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
    }
  )
)

