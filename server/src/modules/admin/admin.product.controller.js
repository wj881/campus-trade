import { success } from '../../utils/response.js'
import * as adminService from './admin.product.service.js'

/** GET /api/v1/admin/products?status&categoryId&keyword&page&pageSize */
export async function list(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 10))
    const data = await adminService.list({
      status: req.query.status,
      categoryId: req.query.categoryId,
      keyword: req.query.keyword,
      page,
      pageSize
    })
    success(res, data)
  } catch (err) {
    next(err)
  }
}

/** PUT /api/v1/admin/products/:id/audit  body: { status: 1通过|2驳回, remark? } */
export async function audit(req, res, next) {
  try {
    const data = await adminService.audit(req.params.id, req.body || {})
    success(res, data, '审核完成')
  } catch (err) {
    next(err)
  }
}

/** PATCH /api/v1/admin/products/:id/offline 后台下架 */
export async function offline(req, res, next) {
  try {
    const data = await adminService.offline(req.params.id)
    success(res, data, '已下架')
  } catch (err) {
    next(err)
  }
}

/** DELETE /api/v1/admin/products/:id 后台删除（软删除） */
export async function remove(req, res, next) {
  try {
    const data = await adminService.remove(req.params.id)
    success(res, data, '已删除')
  } catch (err) {
    next(err)
  }
}
