import { success, fail } from '../../utils/response.js'
import * as authService from './auth.service.js'

/** POST /api/v1/auth/login */
export async function login(req, res, next) {
  try {
    const { username, password } = req.body || {}
    if (!username || !password) {
      return fail(res, { code: 40001, message: '用户名和密码不能为空', httpStatus: 400 })
    }

    const data = await authService.login(String(username).trim(), String(password))
    success(res, {
      token: data.token,
      expiresIn: '2h',
      user: data.user
    })
  } catch (err) {
    next(err)
  }
}

/** POST /api/v1/auth/register */
export async function register(req, res, next) {
  try {
    const { username, password, nickname } = req.body || {}
    if (!username || !password) {
      return fail(res, { code: 40001, message: '用户名和密码不能为空', httpStatus: 400 })
    }
    const data = await authService.register({ username, password, nickname })
    success(res, { token: data.token, expiresIn: '2h', user: data.user }, '注册成功')
  } catch (err) {
    next(err)
  }
}

/** GET /api/v1/auth/me */
export async function me(req, res, next) {
  try {
    const data = await authService.me(req.user.userId)
    success(res, data)
  } catch (err) {
    next(err)
  }
}
