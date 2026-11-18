import prisma from '../../prisma/client.js'

const SALE_STATUS = 2 // 商品在售
const SOLD_STATUS = 3 // 商品已售出
const ONGOING_STATUSES = [1, 2, 3, 4] // 订单进行中（占用商品）

// 状态流转机：role 操作角色，from 前置状态，to 目标状态
const FLOW = {
  confirm: { role: 'seller', from: [1], to: 2, label: '接单' },
  pay: { role: 'buyer', from: [2], to: 3, label: '付款' },
  deliver: { role: 'seller', from: [3], to: 4, label: '发货' },
  complete: { role: 'buyer', from: [4], to: 5, label: '确认收货' },
  cancel: { role: 'both', from: [1, 2, 3], to: 6, label: '取消订单' },
  refund: { role: 'buyer', from: [3, 4], to: 7, label: '申请退款' }
}

function genOrderNo() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `CS${ts}${rand}`
}

const userSelect = { select: { id: true, nickname: true, avatar: true } }

/** 订单实体转前端视图对象 */
export function toOrderVO(o) {
  return {
    id: o.id,
    orderNo: o.orderNo,
    productId: o.productId,
    productTitle: o.productTitle,
    productImage: o.productImage,
    price: Number(o.price),
    quantity: o.quantity,
    totalAmount: Number(o.totalAmount),
    status: o.status,
    tradeLocation: o.tradeLocation,
    remark: o.remark,
    paymentMethod: o.paymentMethod,
    cancelReason: o.cancelReason,
    buyerId: o.buyerId,
    buyerNickname: o.buyer?.nickname,
    sellerId: o.sellerId,
    sellerNickname: o.seller?.nickname,
    createdAt: o.createdAt
  }
}

/** 创建订单：校验在售、非本人、无进行中订单，事务写入并快照商品信息 */
export async function create({ buyerId, productId, quantity, tradeLocation, remark, paymentMethod }) {
  const pid = Number(productId)
  if (!Number.isInteger(pid) || pid <= 0) {
    throw { code: 40001, message: '商品 ID 不合法', httpStatus: 400 }
  }
  const qty = Math.max(1, Number(quantity) || 1)

  const product = await prisma.product.findUnique({ where: { id: pid } })
  if (!product || product.deletedAt) {
    throw { code: 40401, message: '商品不存在或已下架', httpStatus: 404 }
  }
  if (product.status !== SALE_STATUS) {
    throw { code: 40901, message: '商品已售出或下架，无法下单', httpStatus: 409 }
  }
  if (product.sellerId === buyerId) {
    throw { code: 40901, message: '不能购买自己发布的商品', httpStatus: 409 }
  }

  const ongoing = await prisma.order.count({
    where: { productId: pid, status: { in: ONGOING_STATUSES } }
  })
  if (ongoing > 0) {
    throw { code: 40901, message: '商品已被预定，请选择其他商品', httpStatus: 409 }
  }

  const images = await prisma.productImage.findMany({
    where: { productId: pid },
    orderBy: { sort: 'asc' },
    select: { url: true },
    take: 1
  })

  const price = Number(product.price)
  const totalAmount = (price * qty).toFixed(2)

  const order = await prisma.$transaction(async (tx) =>
    tx.order.create({
      data: {
        orderNo: genOrderNo(),
        productId: pid,
        buyerId,
        sellerId: product.sellerId,
        productTitle: product.title,
        productImage: images[0]?.url || null,
        price: price.toFixed(2),
        quantity: qty,
        totalAmount,
        status: 1,
        tradeLocation: tradeLocation ? String(tradeLocation).trim() : product.location,
        remark: remark ? String(remark).trim() : null,
        paymentMethod: Number(paymentMethod) === 2 ? 2 : 1
      }
    })
  )

  const full = await prisma.order.findUnique({
    where: { id: order.id },
    include: { buyer: userSelect, seller: userSelect }
  })
  return toOrderVO(full)
}

/** 我的订单列表：role=buyer 我买入 / seller 我卖出；支持状态、订单号筛选与分页 */
export async function list({ userId, role, status, keyword, page = 1, pageSize = 10 }) {
  const where = role === 'seller' ? { sellerId: userId } : { buyerId: userId }
  if (status) where.status = Number(status)
  if (keyword) where.orderNo = { contains: keyword }

  const skip = (page - 1) * pageSize
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: { buyer: userSelect, seller: userSelect }
    }),
    prisma.order.count({ where })
  ])

  return { list: items.map(toOrderVO), total, page, pageSize }
}

/** 订单详情：仅交易双方或管理员可查看 */
export async function detail(id, user) {
  const orderId = Number(id)
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw { code: 40001, message: '订单 ID 不合法', httpStatus: 400 }
  }
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { buyer: userSelect, seller: userSelect }
  })
  if (!order) {
    throw { code: 40401, message: '订单不存在', httpStatus: 404 }
  }

  const isBuyer = order.buyerId === user.userId
  const isSeller = order.sellerId === user.userId
  if (!isBuyer && !isSeller && user.role !== 2) {
    throw { code: 40301, message: '无权查看该订单', httpStatus: 403 }
  }
  return toOrderVO(order)
}

/** 订单状态流转：校验角色与前置状态，联动商品状态 */
export async function transition(id, action, user, body = {}) {
  const orderId = Number(id)
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw { code: 40001, message: '订单 ID 不合法', httpStatus: 400 }
  }
  const flow = FLOW[action]
  if (!flow) {
    throw { code: 40001, message: '不支持的操作', httpStatus: 400 }
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) {
    throw { code: 40401, message: '订单不存在', httpStatus: 404 }
  }

  const isBuyer = order.buyerId === user.userId
  const isSeller = order.sellerId === user.userId
  if (flow.role === 'seller' && !isSeller) {
    throw { code: 40301, message: '仅卖家可执行该操作', httpStatus: 403 }
  }
  if (flow.role === 'buyer' && !isBuyer) {
    throw { code: 40301, message: '仅买家可执行该操作', httpStatus: 403 }
  }
  if (flow.role === 'both' && !isBuyer && !isSeller) {
    throw { code: 40301, message: '无权操作该订单', httpStatus: 403 }
  }
  if (!flow.from.includes(order.status)) {
    throw { code: 40901, message: `当前订单状态不可${flow.label}`, httpStatus: 409 }
  }

  const data = { status: flow.to }
  const reason = body.cancelReason ? String(body.cancelReason).trim() : ''
  if ((action === 'cancel' || action === 'refund') && reason) {
    data.cancelReason = reason
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data })
    // 交易完成：商品置为已售出
    if (action === 'complete') {
      await tx.product.update({ where: { id: order.productId }, data: { status: SOLD_STATUS } })
    }
  })

  const refreshed = await prisma.order.findUnique({
    where: { id: orderId },
    include: { buyer: userSelect, seller: userSelect }
  })
  return toOrderVO(refreshed)
}

/** 后台订单管理：全量分页，支持状态、订单号 / 商品标题关键词筛选 */
export async function adminList({ status, keyword, page = 1, pageSize = 10 }) {
  const where = {}
  if (status) where.status = Number(status)
  if (keyword) {
    where.OR = [
      { orderNo: { contains: keyword } },
      { productTitle: { contains: keyword } }
    ]
  }

  const skip = (page - 1) * pageSize
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: { buyer: userSelect, seller: userSelect }
    }),
    prisma.order.count({ where })
  ])

  return { list: items.map(toOrderVO), total, page, pageSize }
}
