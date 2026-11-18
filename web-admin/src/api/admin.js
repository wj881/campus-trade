import request from './request'

/** 管理员登录（复用统一登录接口，后端按 role 区分） */
export const login = (data) => request.post('/auth/login', data)

/** 后台商品分页列表（status / categoryId / keyword / page / pageSize） */
export const getAdminProducts = (params) => request.get('/admin/products', { params })

/** 审核商品：body { status: 1通过 | 2驳回, remark? } */
export const auditProduct = (id, data) => request.put(`/admin/products/${id}/audit`, data)

/** 分类下拉选项 */
export const getCategories = () => request.get('/categories', { params: { status: 1 } })

/** 后台订单分页列表（status / keyword / page / pageSize） */
export const getAdminOrders = (params) => request.get('/admin/orders', { params })

// ---------- 用户管理 ----------

/** 后台用户分页列表（keyword / role / status / page / pageSize） */
export const getAdminUsers = (params) => request.get('/admin/users', { params })

/** 封禁 / 解禁用户：body { status: 0封禁 | 1正常 } */
export const updateUserStatus = (id, data) => request.patch(`/admin/users/${id}/status`, data)

/** 角色调整：body { role: 1学生 | 2管理员 } */
export const updateUserRole = (id, data) => request.patch(`/admin/users/${id}/role`, data)

// ---------- 分类管理 ----------

/** 后台分类分页列表（keyword / status / page / pageSize） */
export const getAdminCategories = (params) => request.get('/admin/categories', { params })

/** 新增分类 */
export const createCategory = (data) => request.post('/admin/categories', data)

/** 编辑分类 */
export const updateCategory = (id, data) => request.put(`/admin/categories/${id}`, data)

/** 启用 / 禁用分类：body { status: 0禁用 | 1启用 } */
export const updateCategoryStatus = (id, data) => request.patch(`/admin/categories/${id}/status`, data)

/** 删除分类 */
export const deleteCategory = (id) => request.delete(`/admin/categories/${id}`)

// ---------- 后台商品操作 ----------

/** 后台下架商品 */
export const offlineAdminProduct = (id) => request.patch(`/admin/products/${id}/offline`)

/** 后台删除商品（软删除） */
export const deleteAdminProduct = (id) => request.delete(`/admin/products/${id}`)
