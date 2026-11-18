import request from './request'

/** 创建订单：{ productId, quantity?, tradeLocation?, remark?, paymentMethod? } */
export const createOrder = (data) => request.post('/orders', data)

/** 我的订单：{ role: buyer|seller, status, keyword, page, pageSize } */
export const getOrders = (params) => request.get('/orders', { params })

/** 订单详情 */
export const getOrderDetail = (id) => request.get(`/orders/${id}`)

/** 订单状态流转：action = confirm/pay/deliver/complete/cancel/refund */
export const transitionOrder = (id, action, data) =>
  request.patch(`/orders/${id}/${action}`, data || {})
