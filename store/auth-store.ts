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
  _hasHydrated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoggedIn: false,
      _hasHydrated: false,
      login: (token, user) => set({ token, user, isLoggedIn: true }),
      logout: () => set({ token: null, user: null, isLoggedIn: false }),
      setUser: (user) => {
        const state = get()
        set({ user, isLoggedIn: !!(state.token && user) })
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoggedIn = !!(state.token && state.user)
          state._hasHydrated = true
        }
      },
    }
  )
)

