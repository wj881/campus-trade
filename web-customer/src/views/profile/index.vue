<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showSuccessToast } from 'vant'
import { getMe } from '@/api/auth'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const avatarText = computed(() => {
  const name = userStore.user?.nickname || userStore.user?.username || ''
  return name ? name.slice(0, 1).toUpperCase() : '?'
})

const entries = [
  { icon: 'orders-o', label: '我的订单', path: '/orders' },
  { icon: 'notes-o', label: '我的发布', path: '/my-products' },
  { icon: 'like-o', label: '我的收藏', path: '/favorites' },
  { icon: 'plus', label: '发布闲置', path: '/publish' }
]

const goEntry = (path) => router.push(path)

const goLogin = () => router.push('/login')

const onLogout = async () => {
  try {
    await showConfirmDialog({ title: '退出登录', message: '确定要退出当前账号吗？' })
    userStore.logout()
    showSuccessToast('已退出')
    router.replace('/login')
  } catch {
    // 用户取消
  }
}

onMounted(async () => {
  if (!userStore.isLogin) return
  try {
    const me = await getMe()
    userStore.setLogin({ token: userStore.token, user: me })
  } catch {
    // 刷新失败沿用本地缓存
  }
})
</script>

<template>
  <div class="profile-page">
    <!-- 用户卡片 -->
    <div class="user-card" @click="!userStore.isLogin && goLogin()">
      <div class="avatar">{{ avatarText }}</div>
      <div class="user-info">
        <template v-if="userStore.isLogin">
          <div class="nickname">{{ userStore.user?.nickname || userStore.user?.username }}</div>
          <div class="username">@{{ userStore.user?.username }}</div>
        </template>
        <template v-else>
          <div class="nickname">未登录</div>
          <div class="username">点击登录 / 注册</div>
        </template>
      </div>
    </div>

    <!-- 功能入口 -->
    <van-cell-group inset class="entry-group">
      <van-cell
        v-for="item in entries"
        :key="item.path"
        :icon="item.icon"
        :title="item.label"
        is-link
        @click="goEntry(item.path)"
      />
    </van-cell-group>

    <div class="logout-wrap" v-if="userStore.isLogin">
      <van-button round block plain type="danger" @click="onLogout">退出登录</van-button>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100%;
  padding-bottom: 24px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 28px 20px;
  background: linear-gradient(135deg, #1989fa, #5eb3f7);
  color: #fff;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
}

.nickname {
  font-size: 18px;
  font-weight: 700;
}

.username {
  margin-top: 4px;
  font-size: 13px;
  opacity: 0.85;
}

.entry-group {
  margin-top: 16px;
  border-radius: 12px;
  overflow: hidden;
}

.logout-wrap {
  margin: 28px 16px 0;
}
</style>
