import { defineStore } from 'pinia'

const STORAGE_KEY = 'admin_auth'

function readStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '',
    user: null
  }),

  getters: {
    isLogin: (state) => Boolean(state.token),
    isAdmin: (state) => state.user?.role === 2
  },

  actions: {
    /** 从本地缓存恢复登录态 */
    init() {
      const auth = readStorage()
      if (auth) {
        this.token = auth.token || ''
        this.user = auth.user || null
      }
    },

    /** 保存登录态并持久化 */
    setAuth({ token, user }) {
      this.token = token
      this.user = user
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }))
    },

    /** 退出登录 */
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem(STORAGE_KEY)
    }
  }
})
