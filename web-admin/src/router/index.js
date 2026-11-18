import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    redirect: '/admin/audit',
    children: [
      {
        path: 'audit',
        name: 'ProductAudit',
        component: () => import('@/views/audit/index.vue'),
        meta: { title: '商品审核' }
      },
      {
        path: 'products',
        name: 'ProductManage',
        component: () => import('@/views/product/index.vue'),
        meta: { title: '商品管理' }
      },
      {
        path: 'orders',
        name: 'OrderManage',
        component: () => import('@/views/order/index.vue'),
        meta: { title: '订单管理' }
      },
      {
        path: 'categories',
        name: 'CategoryManage',
        component: () => import('@/views/category/index.vue'),
        meta: { title: '分类管理' }
      },
      {
        path: 'users',
        name: 'UserManage',
        component: () => import('@/views/user/index.vue'),
        meta: { title: '用户管理' }
      }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/admin' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局守卫：登录态 + 管理员身份校验
router.beforeEach((to) => {
  const auth = useAuthStore()
  auth.init()

  if (to.meta.title) {
    document.title = `${to.meta.title} · 校园闲置交易后台`
  }

  if (to.meta.requiresAuth) {
    if (!auth.isLogin) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
    if (!auth.isAdmin) {
      auth.logout()
      return { path: '/login' }
    }
  }
  return true
})

export default router
