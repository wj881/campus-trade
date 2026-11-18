import { success } from '../../utils/response.js'
import * as adminUserService from './admin.user.service.js'

/** GET /api/v1/admin/users?keyword&role&status&page&pageSize */
export async function list(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 10))
    const data = await adminUserService.list({
      keyword: req.query.keyword,
      role: req.query.role,
      status: req.query.status,
      page,
      pageSize
    })
    success(res, data)
  } catch (err) {
    next(err)
  }
}

/** PATCH /api/v1/admin/users/:id/status  body: { status: 0封禁 | 1正常 } */
export async function setStatus(req, res, next) {
  try {
    const data = await adminUserService.setStatus(req.params.id, req.body || {}, req.user.userId)
    success(res, data, '操作成功')
  } catch (err) {
    next(err)
  }
}

/** PATCH /api/v1/admin/users/:id/role  body: { role: 1学生 | 2管理员 } */
export async function setRole(req, res, next) {
  try {
    const data = await adminUserService.setRole(req.params.id, req.body || {}, req.user.userId)
    success(res, data, '角色已更新')
  } catch (err) {
    next(err)
  }
}
