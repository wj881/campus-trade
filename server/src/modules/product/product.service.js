import prisma from '../../prisma/client.js'

const sortMap = {
  newest: { createdAt: 'desc' },
  priceAsc: { price: 'asc' },
  priceDesc: { price: 'desc' },
  views: { viewCount: 'desc' }
}

const CONDITION_LEVELS = [1, 2, 3, 4]
const MAX_IMAGES = 3

/** 商品列表：分页 + 分类筛选 + 关键词搜索 + 排序 */
export async function list({ keyword, categoryId, sort, page = 1, pageSize = 10 }) {
  const where = { status: 2, deletedAt: null }

  if (categoryId) {
    where.categoryId = Number(categoryId)
  }
  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { description: { contains: keyword } }
    ]
  }

  const orderBy = sortMap[sort] || sortMap.newest
  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
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
    list: items.map(toProductVO),
    total,
    page,
    pageSize
  }
}

/** 实体转前端视图对象：金额转 number，剥离内部字段 */
export function toProductVO(p) {
  return {
    id: p.id,
    sellerId: p.sellerId,
    sellerNickname: p.seller?.nickname,
    sellerAvatar: p.seller?.avatar,
    categoryId: p.categoryId,
    categoryName: p.category?.name,
    title: p.title,
    description: p.description,
    price: Number(p.price),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    conditionLevel: p.conditionLevel,
    status: p.status,
    viewCount: p.viewCount,
    location: p.location,
    contact: p.contact,
    images: (p.images || []).map((img) => img.url),
    createdAt: p.createdAt
  }
}

/** 商品详情：浏览量自增，并返回当前登录用户是否收藏（未登录 favorited=false） */
export async function getDetail(id, userId) {
  const productId = Number(id)
  if (!Number.isInteger(productId) || productId <= 0) {
    throw { code: 40001, message: '商品 ID 不合法', httpStatus: 400 }
  }

  const exist = await prisma.product.findUnique({ where: { id: productId } })
  if (!exist || exist.deletedAt) {
    throw { code: 40401, message: '商品不存在或已下架', httpStatus: 404 }
  }

  // 浏览量原子自增，并带回卖家、分类、图片信息
  const updated = await prisma.product.update({
    where: { id: productId },
    data: { viewCount: { increment: 1 } },
    include: {
      seller: { select: { id: true, nickname: true, avatar: true } },
      category: { select: { id: true, name: true } },
      images: { orderBy: { sort: 'asc' } }
    }
  })

  let favorited = false
  if (userId) {
    const fav = await prisma.favorite.findUnique({
      where: { userId_productId: { userId, productId } },
      select: { id: true }
    })
    favorited = Boolean(fav)
  }

  return { ...toProductVO(updated), favorited }
}

/** 发布商品：校验后事务写入商品与图片，新商品默认「待审核」(status=1) */
export async function create({
  sellerId,
  categoryId,
  title,
  description,
  price,
  originalPrice,
  conditionLevel,
  location,
  contact,
  images
}) {
  const cleanTitle = String(title || '').trim()
  if (cleanTitle.length < 2 || cleanTitle.length > 30) {
    throw { code: 40001, message: '标题长度需为 2-30 字', httpStatus: 400 }
  }

  const categoryIdNum = Number(categoryId)
  if (!Number.isInteger(categoryIdNum) || categoryIdNum <= 0) {
    throw { code: 40001, message: '请选择商品分类', httpStatus: 400 }
  }
  const category = await prisma.category.findUnique({ where: { id: categoryIdNum } })
  if (!category || category.status !== 1) {
    throw { code: 40001, message: '分类不可用', httpStatus: 400 }
  }

  const priceNum = Number(price)
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    throw { code: 40001, message: '价格需为大于 0 的数字', httpStatus: 400 }
  }

  const condition = CONDITION_LEVELS.includes(Number(conditionLevel))
    ? Number(conditionLevel)
    : 3
  const imageList = Array.isArray(images) ? images.filter(Boolean).slice(0, MAX_IMAGES) : []
  const originalPriceNum = Number(originalPrice)
  const cleanOriginalPrice =
    Number.isFinite(originalPriceNum) && originalPriceNum > 0
      ? originalPriceNum.toFixed(2)
      : null

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        sellerId,
        categoryId: categoryIdNum,
        title: cleanTitle,
        description: description ? String(description).trim() : null,
        price: priceNum.toFixed(2),
        originalPrice: cleanOriginalPrice,
        conditionLevel: condition,
        status: 1, // 1=待审核，审核通过后才上架
        location: location ? String(location).trim() : null,
        contact: contact ? String(contact).trim() : null
      }
    })

    if (imageList.length) {
      await tx.productImage.createMany({
        data: imageList.map((url, idx) => ({ productId: created.id, url, sort: idx }))
      })
    }
    return created
  })

  return { id: product.id, status: product.status }
}

/** 卖家本人的商品列表（含全部状态，分页） */
export async function myList(sellerId, { status, page = 1, pageSize = 10 }) {
  const where = { sellerId, deletedAt: null }
  if (status) where.status = Number(status)

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

  return { list: items.map(toProductVO), total, page, pageSize }
}

/** 下架商品：仅卖家本人；待审核 / 在售 / 驳回可下架，已售出不可操作 */
export async function offline(id, userId) {
  const productId = Number(id)
  if (!Number.isInteger(productId) || productId <= 0) {
    throw { code: 40001, message: '商品 ID 不合法', httpStatus: 400 }
  }
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product || product.deletedAt) {
    throw { code: 40401, message: '商品不存在或已删除', httpStatus: 404 }
  }
  if (product.sellerId !== userId) {
    throw { code: 40301, message: '仅发布者本人可下架该商品', httpStatus: 403 }
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

/** 软删除商品：卖家本人或管理员 */
export async function remove(id, userId, role) {
  const productId = Number(id)
  if (!Number.isInteger(productId) || productId <= 0) {
    throw { code: 40001, message: '商品 ID 不合法', httpStatus: 400 }
  }
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product || product.deletedAt) {
    throw { code: 40401, message: '商品不存在或已删除', httpStatus: 404 }
  }
  if (product.sellerId !== userId && role !== 2) {
    throw { code: 40301, message: '无权删除该商品', httpStatus: 403 }
  }

  // 存在进行中订单（待确认 / 待付款 / 待交付 / 待收货 / 退款申诉中）时禁止删除
  const ongoingCount = await prisma.order.count({
    where: { productId: productId, status: { in: [1, 2, 3, 4, 7] } }
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
