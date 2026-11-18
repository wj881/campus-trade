import bcrypt from 'bcryptjs'
import prisma from '../src/prisma/client.js'

/** 初始化种子数据：管理员账号 + 默认分类 */
async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10)

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      nickname: '平台管理员',
      role: 2,
      status: 1
    }
  })

  const categories = [
    '教材书籍', '电子数码', '生活用品', '服饰鞋包',
    '运动户外', '美妆配饰', '乐器文娱', '其他闲置'
  ]
  for (let i = 0; i < categories.length; i++) {
    await prisma.category.upsert({
      where: { id: i + 1 },
      update: {},
      create: { name: categories[i], parentId: 0, sort: i + 1, status: 1 }
    })
  }

  console.log('[seed] 种子数据写入完成：管理员 admin / admin123，默认分类 8 个')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
