import { defineStore } from 'pinia'
import { setLoginAuth, getLoginAuth, removeLoginAuth } from '@/utils/storage'

export const useUserStore = defineStore('user', {
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
      const auth = getLoginAuth()
      if (auth) {
        this.token = auth.token || ''
        this.user = auth.user || null
      }
    },

    /** 保存登录态并持久化 */
    setLogin({ token, user }) {
      this.token = token
      this.user = user
      setLoginAuth({ token, user })
    },

    /** 退出登录，清除状态与缓存 */
    logout() {
      this.token = ''
      this.user = null
      removeLoginAuth()
    }
  }
})
