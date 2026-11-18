<script setup>
import { onMounted } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

onMounted(() => {
  // 应用启动时从 localStorage 恢复登录态，刷新页面不丢登录
  userStore.init()
})
</script>

<template>
  <router-view />
</template>
