export interface User {
  id: string
  nickname: string | null
  avatar: string | null
  createdAt?: Date
  updatedAt?: Date
}

export interface UserAuth {
  id: string
  userId: string
  identityType: 'phone' | 'wechat' | 'github'
  identifier: string
  credential?: string | null
  lastLoginAt?: Date | null
}

