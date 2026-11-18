import request from './request'

/** 登录（学生 / 管理员统一入口） */
export const login = (data) => request.post('/auth/login', data)

/** 注册（学生） */
export const register = (data) => request.post('/auth/register', data)

/** 获取当前登录用户 */
export const getMe = () => request.get('/auth/me')
