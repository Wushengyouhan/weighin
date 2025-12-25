import { create } from 'zustand'

type Page = 'home' | 'checkin' | 'leaderboard' | 'profile' | 'halloffame'

interface UIState {
  currentPage: Page
  viewingUserId: string | null
  setCurrentPage: (page: Page) => void
  setViewingUserId: (id: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  currentPage: 'home',
  viewingUserId: null,
  setCurrentPage: (page) => set({ currentPage: page }),
  setViewingUserId: (id) => set({ viewingUserId: id }),
}))

