import { success } from '../../utils/response.js'
import * as adminCategoryService from './admin.category.service.js'

/** GET /api/v1/admin/categories?keyword&status&page&pageSize */
export async function list(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 10))
    const data = await adminCategoryService.list({
      keyword: req.query.keyword,
      status: req.query.status,
      page,
      pageSize
    })
    success(res, data)
  } catch (err) {
    next(err)
  }
}

/** POST /api/v1/admin/categories  body: { name, parentId?, icon?, sort?, status? } */
export async function create(req, res, next) {
  try {
    const data = await adminCategoryService.create(req.body || {})
    success(res, data, '分类已创建')
  } catch (err) {
    next(err)
  }
}

/** PUT /api/v1/admin/categories/:id  body: { name?, parentId?, icon?, sort?, status? } */
export async function update(req, res, next) {
  try {
    const data = await adminCategoryService.update(req.params.id, req.body || {})
    success(res, data, '分类已更新')
  } catch (err) {
    next(err)
  }
}

/** PATCH /api/v1/admin/categories/:id/status  body: { status: 0禁用 | 1启用 } */
export async function setStatus(req, res, next) {
  try {
    const data = await adminCategoryService.setStatus(req.params.id, req.body || {})
    success(res, data, '操作成功')
  } catch (err) {
    next(err)
  }
}

/** DELETE /api/v1/admin/categories/:id */
export async function remove(req, res, next) {
  try {
    const data = await adminCategoryService.remove(req.params.id)
    success(res, data, '分类已删除')
  } catch (err) {
    next(err)
  }
}
