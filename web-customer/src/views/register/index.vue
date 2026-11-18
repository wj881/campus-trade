<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showSuccessToast, showToast } from 'vant'
import { register } from '@/api/auth'
import { useUserStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const form = reactive({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: ''
})

const rules = {
  username: [
    { required: true, message: '请输入学号 / 用户名', trigger: 'blur' },
    { validator: (val) => /^[a-zA-Z0-9_]{3,20}$/.test(val), message: '3-20 位字母、数字或下划线', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { validator: (val) => val.length >= 6, message: '密码不少于 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: (val) => val === form.password, message: '两次输入的密码不一致', trigger: 'blur' }
  ]
}

const onSubmit = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const data = await register({
      username: form.username.trim(),
      nickname: form.nickname.trim(),
      password: form.password
    })
    userStore.setLogin({ token: data.token, user: data.user })
    showSuccessToast('注册成功')
    router.replace(route.query.redirect || '/products')
  } catch (err) {
    // 错误提示已在 Axios 拦截器统一处理
  } finally {
    loading.value = false
  }
}

const goLogin = () => router.push('/login')
</script>

<template>
  <div class="register-page">
    <div class="brand">
      <div class="brand-logo">闲置</div>
      <h1 class="brand-title">创建账号</h1>
      <p class="brand-sub">注册后即可发布闲置 · 参与交易</p>
    </div>

    <van-form @submit="onSubmit">
      <van-cell-group inset class="form-group">
        <van-field
          v-model="form.username"
          label="账号"
          placeholder="学号 / 用户名"
          clearable
          :rules="rules.username"
        />
        <van-field
          v-model="form.nickname"
          label="昵称"
          placeholder="选填，默认同账号"
          clearable
          maxlength="20"
        />
        <van-field
          v-model="form.password"
          type="password"
          label="密码"
          placeholder="不少于 6 位"
          clearable
          :rules="rules.password"
        />
        <van-field
          v-model="form.confirmPassword"
          type="password"
          label="确认密码"
          placeholder="再次输入密码"
          clearable
          :rules="rules.confirmPassword"
        />
      </van-cell-group>

      <div class="submit-btn">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          注册
        </van-button>
      </div>
    </van-form>

    <div class="login">
      已有账号？<span class="link" @click="goLogin">返回登录</span>
    </div>
  </div>
</template>

<style scoped>
.register-page {
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

.login {
  margin-top: 24px;
  text-align: center;
  font-size: 13px;
  color: #969799;
}

.login .link {
  color: var(--brand-primary);
}
</style>
