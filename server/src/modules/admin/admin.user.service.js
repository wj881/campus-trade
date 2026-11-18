import prisma from '../../prisma/client.js'

/**
 * 后台用户分页列表：关键词（账号 / 昵称 / 手机号）、角色、状态筛选。
 * 分页使用 skip + take，不全量查出。
 */
export async function list({ keyword, role, status, page = 1, pageSize = 10 }) {
  const where = { deletedAt: null }

  if (role) where.role = Number(role)
  if (status !== undefined && status !== '') where.status = Number(status)
  if (keyword) {
    where.OR = [
      { username: { contains: keyword } },
      { nickname: { contains: keyword } },
      { phone: { contains: keyword } }
    ]
  }

  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        username: true,
        nickname: true,
        phone: true,
        avatar: true,
        school: true,
        college: true,
        role: true,
        status: true,
        createdAt: true,
        _count: { select: { products: true } }
      }
    }),
    prisma.user.count({ where })
  ])

  return {
    list: items.map((u) => ({
      id: u.id,
      username: u.username,
      nickname: u.nickname,
      phone: u.phone,
      avatar: u.avatar,
      school: u.school,
      college: u.college,
      role: u.role,
      status: u.status,
      productCount: u._count.products,
      createdAt: u.createdAt
    })),
    total,
    page,
    pageSize
  }
}

/** 封禁 / 解禁用户：仅可操作学生账号，不能操作自己 */
export async function setStatus(id, { status }, currentUserId) {
  const userId = Number(id)
  if (!Number.isInteger(userId) || userId <= 0) {
    throw { code: 40001, message: '用户 ID 不合法', httpStatus: 400 }
  }
  const nextStatus = Number(status)
  if (![0, 1].includes(nextStatus)) {
    throw { code: 40001, message: '状态不合法（0 封禁 / 1 正常）', httpStatus: 400 }
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.deletedAt) {
    throw { code: 40401, message: '用户不存在', httpStatus: 404 }
  }
  if (user.id === currentUserId) {
    throw { code: 40301, message: '不能封禁 / 解禁自己', httpStatus: 403 }
  }
  if (user.role === 2) {
    throw { code: 40301, message: '管理员账号不可被封禁', httpStatus: 403 }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: nextStatus }
  })
  return { id: updated.id, status: updated.status }
}

/** 角色调整：学生 ⇄ 管理员；不能操作自己，且需保留至少一个管理员 */
export async function setRole(id, { role }, currentUserId) {
  const userId = Number(id)
  if (!Number.isInteger(userId) || userId <= 0) {
    throw { code: 40001, message: '用户 ID 不合法', httpStatus: 400 }
  }
  const nextRole = Number(role)
  if (![1, 2].includes(nextRole)) {
    throw { code: 40001, message: '角色不合法（1 学生 / 2 管理员）', httpStatus: 400 }
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.deletedAt) {
    throw { code: 40401, message: '用户不存在', httpStatus: 404 }
  }
  if (user.id === currentUserId) {
    throw { code: 40301, message: '不能调整自己的角色', httpStatus: 403 }
  }

  // 降级为学生前，校验当前管理员数量，避免把最后一个管理员降掉
  if (user.role === 2 && nextRole === 1) {
    const adminCount = await prisma.user.count({
      where: { role: 2, status: 1, deletedAt: null }
    })
    if (adminCount <= 1) {
      throw { code: 40901, message: '系统至少需保留一个管理员', httpStatus: 409 }
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: nextRole }
  })
  return { id: updated.id, role: updated.role }
}
