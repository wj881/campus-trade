import { fail } from '../utils/response.js'

/** 404 兜底 */
export function notFound(req, res) {
  fail(res, { code: 40401, message: '接口不存在', httpStatus: 404 })
}

// eslint-disable-next-line no-unused-vars
/** 全局错误处理中间件 */
export function errorHandler(err, req, res, next) {
  console.error('[error]', err)
  fail(res, {
    code: err.code || 50001,
    message: err.message || '服务器内部错误',
    httpStatus: err.httpStatus || 500
  })
}
