import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

/** 签发 JWT */
export function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
}

/** 校验并解析 JWT，失败抛出异常 */
export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret)
}
