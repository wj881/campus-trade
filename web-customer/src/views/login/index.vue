<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showSuccessToast } from 'vant'
import { login } from '@/api/auth'
import { useUserStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入学号 / 用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { validator: (val) => val.length >= 6, message: '密码不少于 6 位', trigger: 'blur' }
  ]
}

const onSubmit = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const data = await login({
      username: form.username.trim(),
      password: form.password
    })
    // 持久化 token 与用户信息，刷新页面不丢登录态
    userStore.setLogin({ token: data.token, user: data.user })
    showSuccessToast('登录成功')
    router.replace(route.query.redirect || '/products')
  } catch (err) {
    // 错误提示已在 Axios 响应拦截器统一处理
  } finally {
    loading.value = false
  }
}

const onRegister = () => {
  router.push('/register')
}
</script>

<template>
  <div class="login-page">
    <div class="brand">
      <div class="brand-logo">闲置</div>
      <h1 class="brand-title">校园闲置交易</h1>
      <p class="brand-sub">好物流转 · 就近交易</p>
    </div>

    <van-form @submit="onSubmit">
      <van-cell-group inset class="form-group">
        <van-field
          v-model="form.username"
          label="账号"
          placeholder="请输入学号 / 用户名"
          clearable
          :rules="rules.username"
        />
        <van-field
          v-model="form.password"
          type="password"
          label="密码"
          placeholder="请输入密码"
          clearable
          :rules="rules.password"
        />
      </van-cell-group>

      <div class="submit-btn">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          登录
        </van-button>
      </div>
    </van-form>

    <div class="register">
      还没有账号？<span class="link" @click="onRegister">立即注册</span>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100%;
  padding: 48px 16px 24px;
}

.brand {
  text-align: center;
  margin-bottom: 36px;
}

.brand-logo {
  width: 72px;
  height: 72px;
  margin: 0 auto 16px;
  border-radius: 20px;
  background: linear-gradient(135deg, #1989fa, #5eb3f7);
  color: #fff;
  font-size: 26px;
  font-weight: 700;
  line-height: 72px;
  box-shadow: 0 8px 20px rgba(25, 137, 250, 0.3);
}

.brand-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.brand-sub {
  margin: 8px 0 0;
  font-size: 13px;
  color: #969799;
}

.form-group {
  border-radius: 12px;
  overflow: hidden;
}

.submit-btn {
  margin: 28px 16px 0;
}

.register {
  margin-top: 24px;
  text-align: center;
  font-size: 13px;
  color: #969799;
}

.register .link {
  color: var(--brand-primary);
}
</style>
