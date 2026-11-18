import prisma from '../../prisma/client.js'
import { toProductVO } from '../product/product.service.js'

/**
 * 后台商品分页列表：查看全状态商品，支持状态 / 分类 / 关键词筛选。
 * 分页使用 skip + take，不全量查出。
 */
export async function list({ status, categoryId, keyword, page = 1, pageSize = 10 }) {
  const where = { deletedAt: null }

  if (status) where.status = Number(status)
  if (categoryId) where.categoryId = Number(categoryId)
  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { description: { contains: keyword } }
    ]
  }

  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        seller: { select: { id: true, nickname: true, avatar: true } },
        category: { select: { id: true, name: true } },
        images: { orderBy: { sort: 'asc' } }
      }
    }),
    prisma.product.count({ where })
  ])

  return {
    list: items.map((p) => ({ ...toProductVO(p), auditRemark: p.auditRemark })),
    total,
    page,
    pageSize
  }
}

/**
 * 审核操作（动作码，区别于商品状态码）：
 *   body.status = 1 通过 → 商品置为 2 在售；
 *   body.status = 2 驳回 → 商品置为 5 审核驳回，记录驳回原因。
 */
export async function audit(id, { status, remark }) {
  const productId = Number(id)
  if (!Number.isInteger(productId) || productId <= 0) {
    throw { code: 40001, message: '商品 ID 不合法', httpStatus: 400 }
  }

  const action = Number(status)
  if (![1, 2].includes(action)) {
    throw { code: 40001, message: '审核操作不合法', httpStatus: 400 }
  }

  const exist = await prisma.product.findUnique({ where: { id: productId } })
  if (!exist || exist.deletedAt) {
    throw { code: 40401, message: '商品不存在或已删除', httpStatus: 404 }
  }

  const data =
    action === 1
      ? { status: 2, auditRemark: null }
      : { status: 5, auditRemark: remark ? String(remark).trim() : '不符合发布规范' }

  const updated = await prisma.product.update({ where: { id: productId }, data })
  return { id: updated.id, status: updated.status, auditRemark: updated.auditRemark }
}

/** 后台下架商品（管理员视角）：待审核 / 在售可下架，已售出 / 驳回不可操作 */
export async function offline(id) {
  const productId = Number(id)
  if (!Number.isInteger(productId) || productId <= 0) {
    throw { code: 40001, message: '商品 ID 不合法', httpStatus: 400 }
  }
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product || product.deletedAt) {
    throw { code: 40401, message: '商品不存在或已删除', httpStatus: 404 }
  }
  if (![1, 2].includes(product.status)) {
    throw { code: 40901, message: '当前状态不可下架（仅待审核 / 在售可下架）', httpStatus: 409 }
  }
  const updated = await prisma.product.update({
    where: { id: productId },
    data: { status: 4 }
  })
  return { id: updated.id, status: updated.status }
}

/** 后台删除商品（管理员，软删除）；存在进行中订单时禁止删除 */
export async function remove(id) {
  const productId = Number(id)
  if (!Number.isInteger(productId) || productId <= 0) {
    throw { code: 40001, message: '商品 ID 不合法', httpStatus: 400 }
  }
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product || product.deletedAt) {
    throw { code: 40401, message: '商品不存在或已删除', httpStatus: 404 }
  }

  const ongoingCount = await prisma.order.count({
    where: { productId, status: { in: [1, 2, 3, 4, 7] } }
  })
  if (ongoingCount > 0) {
    throw { code: 40901, message: '该商品存在进行中的订单，暂不可删除', httpStatus: 409 }
  }

  await prisma.product.update({
    where: { id: productId },
    data: { deletedAt: new Date() }
  })
  return { id: productId }
}
