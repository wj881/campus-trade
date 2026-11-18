<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showSuccessToast, showDialog } from 'vant'
import { getProductDetail, addFavorite, removeFavorite } from '@/api/product'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const detail = ref(null)
const loading = ref(false)
const favorited = ref(false)

const conditionMap = {
  1: '全新',
  2: '几乎全新',
  3: '轻微使用',
  4: '明显使用'
}

const images = computed(() => detail.value?.images || [])

const loadDetail = async () => {
  const id = route.params.id
  loading.value = true
  try {
    const data = await getProductDetail(id)
    detail.value = data
    favorited.value = Boolean(data.favorited)
  } catch {
    // 错误提示已在 Axios 拦截器统一处理
  } finally {
    loading.value = false
  }
}

/** 未登录则跳转登录页，并记录回跳地址 */
const requireLogin = () => {
  if (userStore.isLogin) return true
  router.push({ path: '/login', query: { redirect: route.fullPath } })
  return false
}

const onFavorite = async () => {
  if (!requireLogin()) return
  if (!detail.value) return
  try {
    if (favorited.value) {
      await removeFavorite(detail.value.id)
      favorited.value = false
      showToast('已取消收藏')
    } else {
      await addFavorite(detail.value.id)
      favorited.value = true
      showSuccessToast('收藏成功')
    }
  } catch {
    // 拦截器已提示
  }
}

const onContact = () => {
  if (!requireLogin()) return
  const contact = detail.value?.contact
  if (contact) {
    showDialog({ title: '联系方式', message: contact, showCancelButton: true })
  } else {
    showToast('卖家暂未留下联系方式')
  }
}

const onBuy = () => {
  if (!requireLogin()) return
  if (!detail.value) return
  router.push(`/order/confirm/${detail.value.id}`)
}

onMounted(loadDetail)
</script>

<template>
  <div class="detail-page">
    <van-nav-bar title="商品详情" left-arrow @click-left="router.back()" />

    <van-loading v-if="loading" class="loading" vertical>加载中...</van-loading>

    <template v-else-if="detail">
      <!-- 图片轮播 -->
      <van-swipe class="banner" :autoplay="3000" indicator-color="#fff" lazy-render>
        <van-swipe-item v-for="(img, i) in images" :key="i">
          <img :src="img" class="banner-img" :alt="detail.title" />
        </van-swipe-item>
        <van-swipe-item v-if="!images.length">
          <div class="banner-placeholder">暂无图片</div>
        </van-swipe-item>
      </van-swipe>

      <!-- 价格与标题 -->
      <div class="card info">
        <div class="price-row">
          <span class="price">{{ detail.price }}</span>
          <span v-if="detail.originalPrice" class="origin-price">¥{{ detail.originalPrice }}</span>
          <van-tag plain type="primary">
            {{ conditionMap[detail.conditionLevel] || '成色未知' }}
          </van-tag>
        </div>
        <div class="title">{{ detail.title }}</div>
        <div class="meta">
          <span>{{ detail.categoryName || '未分类' }}</span>
          <span>{{ detail.location || '校内面交' }}</span>
          <span>浏览 {{ detail.viewCount || 0 }}</span>
        </div>
      </div>

      <!-- 商品描述 -->
      <div class="card section">
        <div class="section-title">商品描述</div>
        <div class="desc">{{ detail.description || '卖家未填写描述' }}</div>
      </div>

      <!-- 卖家信息 -->
      <div class="card seller">
        <van-image round width="40" height="40" :src="detail.sellerAvatar" fit="cover">
          <template #error>
            <div class="seller-avatar-placeholder">卖家</div>
          </template>
        </van-image>
        <div class="seller-info">
          <div class="seller-name">{{ detail.sellerNickname || '匿名同学' }}</div>
          <div class="seller-sub">卖家信息</div>
        </div>
      </div>
    </template>

    <van-empty v-else description="商品不存在或已下架" />

    <!-- 底部操作栏 -->
    <van-action-bar>
      <van-action-bar-icon
        :icon="favorited ? 'star' : 'star-o'"
        :class="{ active: favorited }"
        text="收藏"
        @click="onFavorite"
      />
      <van-action-bar-icon icon="chat-o" text="联系卖家" @click="onContact" />
      <van-action-bar-button type="warning" text="立即购买" @click="onBuy" />
    </van-action-bar>
  </div>
</template>

<style scoped>
.detail-page {
  min-height: 100%;
  /* 为固定底部操作栏预留高度 */
  padding-bottom: 60px;
}

.loading {
  padding: 80px 0;
}

.banner {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #f7f8fa;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.banner-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c8c9cc;
  font-size: 14px;
}

.card {
  background: #fff;
  margin: 12px;
  border-radius: 12px;
  padding: 14px;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.origin-price {
  color: #969799;
  font-size: 13px;
  text-decoration: line-through;
}

.title {
  margin-top: 10px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
}

.meta {
  display: flex;
  gap: 14px;
  margin-top: 10px;
  font-size: 12px;
  color: #969799;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
}

.desc {
  font-size: 14px;
  line-height: 1.6;
  color: #646566;
  white-space: pre-wrap;
}

.seller {
  display: flex;
  align-items: center;
  gap: 12px;
}

.seller-avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f2f3f5;
  color: #969799;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.seller-name {
  font-size: 14px;
  font-weight: 500;
}

.seller-sub {
  font-size: 12px;
  color: #969799;
  margin-top: 2px;
}

.action-bar-icon.active {
  color: var(--price-color);
}
</style>
