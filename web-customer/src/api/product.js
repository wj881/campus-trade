import request from './request'

/** 商品分页列表（keyword/categoryId/conditionLevel/priceMin/priceMax/sort/page/pageSize） */
export const getProducts = (params) => request.get('/products', { params })

/** 商品详情 */
export const getProductDetail = (id) => request.get(`/products/${id}`)

/** 分类列表（前台仅启用项） */
export const getCategories = () => request.get('/categories', { params: { status: 1 } })

/** 收藏商品 */
export const addFavorite = (productId) => request.post('/favorites', { productId })

/** 取消收藏 */
export const removeFavorite = (productId) => request.delete(`/favorites/${productId}`)

/** 我的收藏列表（分页） */
export const getFavorites = (params) => request.get('/favorites', { params })

/** 我的发布（卖家本人，全状态分页） */
export const getMyProducts = (params) => request.get('/users/me/products', { params })

/** 下架我的商品 */
export const offlineProduct = (id) => request.patch(`/products/${id}/offline`)

/** 删除我的商品（软删除） */
export const deleteProduct = (id) => request.delete(`/products/${id}`)

/** 发布商品 */
export const createProduct = (data) => request.post('/products', data)

/** 上传商品图片（单图，FormData），返回 { url } */
export const uploadImage = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
