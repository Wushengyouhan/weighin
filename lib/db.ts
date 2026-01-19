import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 创建 Prisma Client 实例
// 使用 UTC 时间存储（业界标准做法）
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

export const db = prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

