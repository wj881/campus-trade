import { Router } from 'express'
import { login, register, me } from '../modules/auth/auth.controller.js'
import {
  list as productList,
  detail as productDetail,
  create as productCreate,
  myList as productMyList,
  offline as productOffline,
  remove as productRemove
} from '../modules/product/product.controller.js'
import { list as categoryList } from '../modules/category/category.controller.js'
import {
  create as favoriteCreate,
  remove as favoriteRemove,
  list as favoriteList
} from '../modules/favorite/favorite.controller.js'
import { uploadImage } from '../modules/upload/upload.controller.js'
import {
  list as adminProductList,
  audit as adminProductAudit,
  offline as adminProductOffline,
  remove as adminProductRemove
} from '../modules/admin/admin.product.controller.js'
import {
  list as adminUserList,
  setStatus as adminUserStatus,
  setRole as adminUserRole
} from '../modules/admin/admin.user.controller.js'
import {
  list as adminCategoryList,
  create as adminCategoryCreate,
  update as adminCategoryUpdate,
  setStatus as adminCategoryStatus,
  remove as adminCategoryRemove
} from '../modules/admin/admin.category.controller.js'
import {
  create as orderCreate,
  list as orderList,
  detail as orderDetail,
  confirm as orderConfirm,
  pay as orderPay,
  deliver as orderDeliver,
  complete as orderComplete,
  cancel as orderCancel,
  refund as orderRefund,
  adminList as adminOrderList
} from '../modules/order/order.controller.js'
import { authRequired, adminRequired, optionalAuth } from '../middleware/auth.js'

const router = Router()

// 认证
router.post('/auth/login', login)
router.post('/auth/register', register)
router.get('/auth/me', authRequired, me)

// 商品
router.get('/products', productList)
router.get('/products/:id', optionalAuth, productDetail)
router.post('/products', authRequired, productCreate)
router.get('/users/me/products', authRequired, productMyList)
router.patch('/products/:id/offline', authRequired, productOffline)
router.delete('/products/:id', authRequired, productRemove)

// 分类
router.get('/categories', categoryList)

// 图片上传（需登录）
router.post('/upload', authRequired, uploadImage)

// 收藏（均需登录）
router.post('/favorites', authRequired, favoriteCreate)
router.get('/favorites', authRequired, favoriteList)
router.delete('/favorites/:productId', authRequired, favoriteRemove)

// 订单（均需登录）
router.post('/orders', authRequired, orderCreate)
router.get('/orders', authRequired, orderList)
router.get('/orders/:id', authRequired, orderDetail)
router.patch('/orders/:id/confirm', authRequired, orderConfirm)
router.patch('/orders/:id/pay', authRequired, orderPay)
router.patch('/orders/:id/deliver', authRequired, orderDeliver)
router.patch('/orders/:id/complete', authRequired, orderComplete)
router.patch('/orders/:id/cancel', authRequired, orderCancel)
router.patch('/orders/:id/refund', authRequired, orderRefund)

// 后台管理（需登录 + 管理员身份，普通学生角色返回 40301）
router.get('/admin/products', authRequired, adminRequired, adminProductList)
router.put('/admin/products/:id/audit', authRequired, adminRequired, adminProductAudit)
router.patch('/admin/products/:id/offline', authRequired, adminRequired, adminProductOffline)
router.delete('/admin/products/:id', authRequired, adminRequired, adminProductRemove)
router.get('/admin/orders', authRequired, adminRequired, adminOrderList)

// 后台用户管理
router.get('/admin/users', authRequired, adminRequired, adminUserList)
router.patch('/admin/users/:id/status', authRequired, adminRequired, adminUserStatus)
router.patch('/admin/users/:id/role', authRequired, adminRequired, adminUserRole)

// 后台分类管理
router.get('/admin/categories', authRequired, adminRequired, adminCategoryList)
router.post('/admin/categories', authRequired, adminRequired, adminCategoryCreate)
router.put('/admin/categories/:id', authRequired, adminRequired, adminCategoryUpdate)
router.patch('/admin/categories/:id/status', authRequired, adminRequired, adminCategoryStatus)
router.delete('/admin/categories/:id', authRequired, adminRequired, adminCategoryRemove)

export default router
