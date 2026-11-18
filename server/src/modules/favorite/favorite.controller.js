import { success } from '../../utils/response.js'
import * as favoriteService from './favorite.service.js'

/** POST /api/v1/favorites  body: { productId } */
export async function create(req, res, next) {
  try {
    const { productId } = req.body || {}
    const data = await favoriteService.add(req.user.userId, productId)
    success(res, data, '收藏成功')
  } catch (err) {
    next(err)
  }
}

/** DELETE /api/v1/favorites/:productId */
export async function remove(req, res, next) {
  try {
    const data = await favoriteService.remove(req.user.userId, req.params.productId)
    success(res, data, '已取消收藏')
  } catch (err) {
    next(err)
  }
}

/** GET /api/v1/favorites?page&pageSize */
export async function list(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 10))
    const data = await favoriteService.list(req.user.userId, page, pageSize)
    success(res, data)
  } catch (err) {
    next(err)
  }
}
