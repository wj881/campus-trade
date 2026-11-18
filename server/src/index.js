import app from './app.js'
import { env } from './config/env.js'
import prisma from './prisma/client.js'

app.listen(env.port, () => {
  console.log(`[server] running on http://localhost:${env.port}/api/v1`)
})

// 退出时断开数据库连接
process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})
