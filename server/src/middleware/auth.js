import { verifyToken } from '../utils/jwt.js'
import { fail } from '../utils/response.js'

/** 登录校验：解析 Bearer Token，挂载 req.user = { userId, role, username } */
export function authRequired(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!token) {
    return fail(res, { code: 40101, message: '未登录或登录已过期', httpStatus: 401 })
  }

  try {
    const payload = verifyToken(token)
    req.user = {
      userId: payload.userId,
      role: payload.role,
      username: payload.username
    }
    next()
  } catch {
    return fail(res, { code: 40101, message: '登录状态无效，请重新登录', httpStatus: 401 })
  }
}

/** 管理员校验：需在 authRequired 之后使用 */
export function adminRequired(req, res, next) {
  if (req.user?.role !== 2) {
    return fail(res, { code: 40301, message: '无管理员权限', httpStatus: 403 })
  }
  next()
}

/** 可选鉴权：带 Token 则解析并挂载 req.user；未带 / 无效则放行，req.user 为 undefined */
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!token) return next()

  try {
    const payload = verifyToken(token)
    req.user = {
      userId: payload.userId,
      role: payload.role,
      username: payload.username
    }
  } catch {
    req.user = undefined
  }
  next()
}
