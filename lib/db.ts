import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 创建 Prisma Client 实例
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// 连接数据库时设置时区为北京时间（UTC+8）
if (!globalForPrisma.prisma) {
  prisma.$connect().then(async () => {
    try {
      await prisma.$executeRawUnsafe(`SET time_zone = '+08:00'`)
      if (process.env.NODE_ENV === 'development') {
        console.log('MySQL session timezone set to +08:00 (Asia/Shanghai)')
      }
    } catch (err) {
      console.warn('Failed to set MySQL timezone:', err)
    }
  }).catch(() => {
    // 连接失败会在实际使用时重试
  })
}

export const db = prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

