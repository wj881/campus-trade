import prisma from '../../prisma/client.js'

/** 分类名称校验：2-20 字 */
function validateName(name) {
  const n = String(name || '').trim()
  if (n.length < 2 || n.length > 20) {
    throw { code: 40001, message: '分类名称需为 2-20 字', httpStatus: 400 }
  }
  return n
}

/** 后台分类分页列表（含禁用），附带每个分类下的商品数量 */
export async function list({ keyword, status, page = 1, pageSize = 10 }) {
  const where = {}
  if (status !== undefined && status !== '') where.status = Number(status)
  if (keyword) where.name = { contains: keyword }

  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: pageSize,
      include: { _count: { select: { products: true } } }
    }),
    prisma.category.count({ where })
  ])

  return {
    list: items.map((c) => ({
      id: c.id,
      name: c.name,
      parentId: c.parentId,
      icon: c.icon,
      sort: c.sort,
      status: c.status,
      productCount: c._count.products,
      createdAt: c.createdAt
    })),
    total,
    page,
    pageSize
  }
}

/** 新增分类 */
export async function create({ name, parentId, icon, sort, status }) {
  const trimmedName = validateName(name)

  const exist = await prisma.category.findFirst({ where: { name: trimmedName } })
  if (exist) {
    throw { code: 40901, message: '分类名称已存在', httpStatus: 409 }
  }

  const category = await prisma.category.create({
    data: {
      name: trimmedName,
      parentId: Number(parentId) || 0,
      icon: icon ? String(icon).trim() : null,
      sort: Number(sort) || 0,
      status: status === undefined || status === '' ? 1 : Number(status)
    }
  })
  return { id: category.id, status: category.status }
}

/** 编辑分类 */
export async function update(id, { name, parentId, icon, sort, status }) {
  const categoryId = Number(id)
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw { code: 40001, message: '分类 ID 不合法', httpStatus: 400 }
  }
  const exist = await prisma.category.findUnique({ where: { id: categoryId } })
  if (!exist) {
    throw { code: 40401, message: '分类不存在', httpStatus: 404 }
  }

  const data = {}
  if (name !== undefined) {
    const trimmedName = validateName(name)
    const dup = await prisma.category.findFirst({
      where: { name: trimmedName, NOT: { id: categoryId } }
    })
    if (dup) {
      throw { code: 40901, message: '分类名称已存在', httpStatus: 409 }
    }
    data.name = trimmedName
  }
  if (parentId !== undefined) data.parentId = Number(parentId) || 0
  if (icon !== undefined) data.icon = icon ? String(icon).trim() : null
  if (sort !== undefined) data.sort = Number(sort) || 0
  if (status !== undefined && status !== '') data.status = Number(status)

  const updated = await prisma.category.update({ where: { id: categoryId }, data })
  return { id: updated.id, status: updated.status }
}

/** 启用 / 禁用分类 */
export async function setStatus(id, { status }) {
  const categoryId = Number(id)
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw { code: 40001, message: '分类 ID 不合法', httpStatus: 400 }
  }
  const nextStatus = Number(status)
  if (![0, 1].includes(nextStatus)) {
    throw { code: 40001, message: '状态不合法（0 禁用 / 1 启用）', httpStatus: 400 }
  }
  const exist = await prisma.category.findUnique({ where: { id: categoryId } })
  if (!exist) {
    throw { code: 40401, message: '分类不存在', httpStatus: 404 }
  }
  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: { status: nextStatus }
  })
  return { id: updated.id, status: updated.status }
}

/** 删除分类：存在商品时禁止删除 */
export async function remove(id) {
  const categoryId = Number(id)
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw { code: 40001, message: '分类 ID 不合法', httpStatus: 400 }
  }
  const exist = await prisma.category.findUnique({ where: { id: categoryId } })
  if (!exist) {
    throw { code: 40401, message: '分类不存在', httpStatus: 404 }
  }

  const productCount = await prisma.product.count({
    where: { categoryId, deletedAt: null }
  })
  if (productCount > 0) {
    throw { code: 40901, message: '该分类下存在商品，不可删除', httpStatus: 409 }
  }

  await prisma.category.delete({ where: { id: categoryId } })
  return { id: categoryId }
}
