import { PrismaClient } from '@prisma/client'

// 全局复用 PrismaClient 实例，避免开发态热重载产生过多连接
const globalForPrisma = globalThis
const prisma = globalForPrisma.__prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma
}

export default prisma
