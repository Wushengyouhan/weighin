export interface Checkin {
  id: string
  userId: string
  weight: number
  photoUrl: string
  weekNumber: number
  createdAt: Date
  updatedAt: Date
}

export interface CheckinFormData {
  weight: number
  photo: File | null
}

