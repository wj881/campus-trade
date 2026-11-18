import prisma from '../../prisma/client.js'
import { toProductVO } from '../product/product.service.js'

const SALE_STATUS = 2 // 商品在售

/** 校验商品可被收藏：存在、未软删除、处于在售状态 */
async function ensureFavoritable(productId) {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product || product.deletedAt) {
    throw { code: 40401, message: '商品不存在或已下架', httpStatus: 404 }
  }
  if (product.status !== SALE_STATUS) {
    throw { code: 40901, message: '当前商品不可收藏', httpStatus: 409 }
  }
  return product
}

/** 添加收藏（幂等：重复收藏不报错，直接返回已收藏状态） */
export async function add(userId, productIdRaw) {
  const productId = Number(productIdRaw)
  if (!Number.isInteger(productId) || productId <= 0) {
    throw { code: 40001, message: '商品 ID 不合法', httpStatus: 400 }
  }
  await ensureFavoritable(productId)

  const exist = await prisma.favorite.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true }
  })
  if (exist) {
    return { productId, favorited: true }
  }

  await prisma.favorite.create({ data: { userId, productId } })
  return { productId, favorited: true }
}

/** 取消收藏（幂等：原本未收藏也返回成功） */
export async function remove(userId, productIdRaw) {
  const productId = Number(productIdRaw)
  if (!Number.isInteger(productId) || productId <= 0) {
    throw { code: 40001, message: '商品 ID 不合法', httpStatus: 400 }
  }
  await prisma.favorite.deleteMany({ where: { userId, productId } })
  return { productId, favorited: false }
}

/** 当前登录用户的收藏分页列表（按收藏时间倒序） */
export async function list(userId, page = 1, pageSize = 10) {
  const skip = (page - 1) * pageSize
  const where = { userId, product: { deletedAt: null } }

  const [items, total] = await Promise.all([
    prisma.favorite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        product: {
          include: {
            seller: { select: { id: true, nickname: true, avatar: true } },
            category: { select: { id: true, name: true } },
            images: { orderBy: { sort: 'asc' } }
          }
        }
      }
    }),
    prisma.favorite.count({ where })
  ])

  return {
    list: items.map((fav) => ({
      id: fav.id,
      createdAt: fav.createdAt,
      product: toProductVO(fav.product)
    })),
    total,
    page,
    pageSize
  }
}
