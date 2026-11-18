import axios from 'axios'
import { showToast } from 'vant'
import { useUserStore } from '@/store/user'
import router from '@/router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000
})

// 请求拦截器：携带登录 Token
request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一解包 { code, message, data }
request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 0) {
      return res.data
    }
    showToast(res.message || '请求失败')
    return Promise.reject(new Error(res.message || 'Business Error'))
  },
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message

    if (status === 401) {
      // 登录失效：清除本地态并跳转登录页
      const userStore = useUserStore()
      userStore.logout()
      router.replace('/login')
    }
    showToast(message || '网络异常，请稍后重试')
    return Promise.reject(error)
  }
)

export default request
