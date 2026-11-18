import bcrypt from 'bcryptjs'
import prisma from '../../prisma/client.js'
import { signToken } from '../../utils/jwt.js'

/** 过滤敏感字段，返回安全用户信息 */
export function toSafeUser(user) {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    avatar: user.avatar,
    phone: user.phone,
    school: user.school,
    college: user.college,
    gender: user.gender,
    role: user.role,
    status: user.status
  }
}

/** 账号密码登录，返回 JWT 与用户信息 */
export async function login(username, password) {
  const user = await prisma.user.findUnique({ where: { username } })

  if (!user || user.deletedAt) {
    throw { code: 40101, message: '用户名或密码错误', httpStatus: 401 }
  }
  if (user.status !== 1) {
    throw { code: 40301, message: '账号已被封禁，请联系管理员', httpStatus: 403 }
  }

  const matched = await bcrypt.compare(password, user.passwordHash)
  if (!matched) {
    throw { code: 40101, message: '用户名或密码错误', httpStatus: 401 }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  })

  const token = signToken({
    userId: user.id,
    role: user.role,
    username: user.username
  })

  return { token, user: toSafeUser(user) }
}

/** 注册：校验用户名唯一，哈希密码，默认学生角色，签发 Token */
export async function register({ username, password, nickname, phone, school, college }) {
  const name = String(username || '').trim()
  if (!/^[a-zA-Z0-9_]{4,50}$/.test(name)) {
    throw { code: 40001, message: '用户名需为 4-50 位字母、数字或下划线', httpStatus: 400 }
  }
  const pwd = String(password || '')
  if (pwd.length < 6 || pwd.length > 20) {
    throw { code: 40001, message: '密码为 6-20 位', httpStatus: 400 }
  }

  const exist = await prisma.user.findUnique({ where: { username: name } })
  if (exist) {
    throw { code: 40901, message: '用户名已被注册', httpStatus: 409 }
  }

  const trimmedPhone = phone ? String(phone).trim() : null
  if (trimmedPhone) {
    const phoneExist = await prisma.user.findUnique({ where: { phone: trimmedPhone } })
    if (phoneExist) {
      throw { code: 40901, message: '手机号已被注册', httpStatus: 409 }
    }
  }

  const passwordHash = await bcrypt.hash(pwd, 10)
  const user = await prisma.user.create({
    data: {
      username: name,
      passwordHash,
      nickname: nickname ? String(nickname).trim().slice(0, 50) : name,
      phone: trimmedPhone || null,
      school: school ? String(school).trim().slice(0, 100) : null,
      college: college ? String(college).trim().slice(0, 100) : null,
      role: 1,
      status: 1
    }
  })

  const token = signToken({
    userId: user.id,
    role: user.role,
    username: user.username
  })
  return { token, user: toSafeUser(user) }
}

/** 当前登录用户信息 */
export async function me(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.deletedAt) {
    throw { code: 40401, message: '用户不存在', httpStatus: 404 }
  }
  return toSafeUser(user)
}
