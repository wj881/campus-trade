import { success } from '../../utils/response.js'
import * as orderService from './order.service.js'

/** POST /api/v1/orders  body: { productId, quantity?, tradeLocation?, remark?, paymentMethod? } */
export async function create(req, res, next) {
  try {
    const data = await orderService.create({ buyerId: req.user.userId, ...req.body })
    success(res, data, '下单成功')
  } catch (err) {
    next(err)
  }
}

/** GET /api/v1/orders?role=buyer|seller&status&keyword&page&pageSize */
export async function list(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 10))
    const data = await orderService.list({
      userId: req.user.userId,
      role: req.query.role,
      status: req.query.status,
      keyword: req.query.keyword,
      page,
      pageSize
    })
    success(res, data)
  } catch (err) {
    next(err)
  }
}

/** GET /api/v1/orders/:id */
export async function detail(req, res, next) {
  try {
    const data = await orderService.detail(req.params.id, req.user)
    success(res, data)
  } catch (err) {
    next(err)
  }
}

/** 生成状态流转控制器：confirm / pay / deliver / complete / cancel / refund */
function makeTransition(action) {
  return async (req, res, next) => {
    try {
      const data = await orderService.transition(req.params.id, action, req.user, req.body || {})
      success(res, data, '操作成功')
    } catch (err) {
      next(err)
    }
  }
}

export const confirm = makeTransition('confirm')
export const pay = makeTransition('pay')
export const deliver = makeTransition('deliver')
export const complete = makeTransition('complete')
export const cancel = makeTransition('cancel')
export const refund = makeTransition('refund')

/** GET /api/v1/admin/orders  需管理员 */
export async function adminList(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 10))
    const data = await orderService.adminList({
      status: req.query.status,
      keyword: req.query.keyword,
      page,
      pageSize
    })
    success(res, data)
  } catch (err) {
    next(err)
  }
}
