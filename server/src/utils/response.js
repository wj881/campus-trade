/** 统一成功响应：{ code: 0, message, data } */
export function success(res, data = null, message = 'success') {
  res.json({ code: 0, message, data })
}

/** 统一失败响应 */
export function fail(
  res,
  { code = 50001, message = '服务器错误', httpStatus = 500, data = null } = {}
) {
  res.status(httpStatus).json({ code, message, data })
}
