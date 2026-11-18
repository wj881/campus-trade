import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  { path: '/', redirect: '/products' },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/register/index.vue'),
    meta: { title: '注册' }
  },
  {
    path: '/products',
    name: 'ProductList',
    component: () => import('@/views/product/list.vue'),
    meta: { title: '闲置集市' }
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: () => import('@/views/product/detail.vue'),
    meta: { title: '商品详情' }
  },
  {
    path: '/publish',
    name: 'ProductPublish',
    component: () => import('@/views/product/publish.vue'),
    meta: { title: '发布闲置', requireAuth: true }
  },
  {
    path: '/order/confirm/:productId',
    name: 'OrderConfirm',
    component: () => import('@/views/order/confirm.vue'),
    meta: { title: '确认订单', requireAuth: true }
  },
  {
    path: '/orders',
    name: 'OrderList',
    component: () => import('@/views/order/list.vue'),
    meta: { title: '我的订单', requireAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/index.vue'),
    meta: { title: '个人中心', requireAuth: true }
  },
  {
    path: '/my-products',
    name: 'MyProducts',
    component: () => import('@/views/my-products/index.vue'),
    meta: { title: '我的发布', requireAuth: true }
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('@/views/favorites/index.vue'),
    meta: { title: '我的收藏', requireAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫：设置页面标题；需登录的页面校验登录态，未登录跳转登录页并回跳
router.beforeEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · 校园闲置交易` : '校园闲置交易'
  const userStore = useUserStore()
  if (to.meta.requireAuth && !userStore.isLogin) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
