import { success } from '../../utils/response.js'
import * as productService from './product.service.js'

/** GET /api/v1/products?keyword&categoryId&sort&page&pageSize */
export async function list(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 10))
    const { keyword, categoryId, sort } = req.query

    const data = await productService.list({
      keyword,
      categoryId,
      sort,
      page,
      pageSize
    })
    success(res, data)
  } catch (err) {
    next(err)
  }
}

/** GET /api/v1/products/:id （可选鉴权：带 Token 回传当前用户是否收藏） */
export async function detail(req, res, next) {
  try {
    const userId = req.user?.userId
    const data = await productService.getDetail(req.params.id, userId)
    success(res, data)
  } catch (err) {
    next(err)
  }
}

/** POST /api/v1/products 发布商品（需登录，默认待审核） */
export async function create(req, res, next) {
  try {
    const data = await productService.create({
      sellerId: req.user.userId,
      ...req.body
    })
    success(res, data, '发布成功，等待审核')
  } catch (err) {
    next(err)
  }
}

/** GET /api/v1/users/me/products 我的发布（卖家本人，全状态分页） */
export async function myList(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 10))
    const data = await productService.myList(req.user.userId, {
      status: req.query.status,
      page,
      pageSize
    })
    success(res, data)
  } catch (err) {
    next(err)
  }
}

/** PATCH /api/v1/products/:id/offline 下架（卖家本人） */
export async function offline(req, res, next) {
  try {
    const data = await productService.offline(req.params.id, req.user.userId)
    success(res, data, '已下架')
  } catch (err) {
    next(err)
  }
}

/** DELETE /api/v1/products/:id 删除（本人 / 管理员，软删除） */
export async function remove(req, res, next) {
  try {
    const data = await productService.remove(req.params.id, req.user.userId, req.user.role)
    success(res, data, '已删除')
  } catch (err) {
    next(err)
  }
}
