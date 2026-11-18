<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { login } from '@/api/admin'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref({ username: '', password: '' })
const loading = ref(false)

const onSubmit = async () => {
  if (!form.value.username || !form.value.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  loading.value = true
  try {
    const data = await login(form.value)
    if (data.user.role !== 2) {
      ElMessage.error('该账号不是管理员，无法进入后台')
      return
    }
    authStore.setAuth({ token: data.token, user: data.user })
    ElMessage.success('登录成功')
    router.replace(route.query.redirect || '/admin/audit')
  } catch {
    // 错误提示已在拦截器统一处理
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <el-card class="login-card">
      <div class="login-title">校园闲置交易 · 后台管理</div>
      <el-form label-position="top" @submit.prevent="onSubmit">
        <el-form-item label="账号">
          <el-input
            v-model="form.username"
            placeholder="请输入管理员账号"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="onSubmit"
          />
        </el-form-item>
        <el-button type="primary" class="login-btn" :loading="loading" @click="onSubmit">
          登录后台
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}

.login-card {
  width: 380px;
  border-radius: 12px;
}

.login-title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 24px;
}

.login-btn {
  width: 100%;
}
</style>
