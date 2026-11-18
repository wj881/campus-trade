<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showSuccessToast } from 'vant'
import { getFavorites, removeFavorite } from '@/api/product'

const router = useRouter()

const conditionMap = {
  1: '全新',
  2: '几乎全新',
  3: '轻微使用',
  4: '明显使用'
}

const list = ref([])
const page = ref(1)
const finished = ref(false)
const loading = ref(false)

const resetAndLoad = () => {
  list.value = []
  page.value = 1
  finished.value = false
  loading.value = false
  loadList()
}

const loadList = async () => {
  loading.value = true
  try {
    const data = await getFavorites({ page: page.value, pageSize: 10 })
    list.value.push(...(data.list || []))
    finished.value = list.value.length >= (data.total || 0)
    page.value++
  } catch {
    finished.value = true
  } finally {
    loading.value = false
  }
}

const onRemove = async (fav) => {
  try {
    await showConfirmDialog({ title: '取消收藏', message: '确定取消收藏该商品吗？' })
    await removeFavorite(fav.product.id)
    showSuccessToast('已取消收藏')
    resetAndLoad()
  } catch {
    // 取消或拦截器提示
  }
}

const goDetail = (id) => router.push(`/product/${id}`)
</script>

<template>
  <div class="favorites-page">
    <van-nav-bar title="我的收藏" />

    <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="loadList">
      <div v-for="fav in list" :key="fav.id" class="card">
        <div class="card-body" @click="goDetail(fav.product.id)">
          <van-image width="80" height="80" fit="cover" :src="fav.product.images?.[0]">
            <template #error><div class="img-placeholder">无图</div></template>
          </van-image>
          <div class="info">
            <div class="title">{{ fav.product.title }}</div>
            <div class="meta">
              <span class="price">¥{{ fav.product.price }}</span>
              <span class="condition">{{ conditionMap[fav.product.conditionLevel] || '成色未知' }}</span>
            </div>
            <div class="sub">卖家：{{ fav.product.sellerNickname || '匿名' }}</div>
          </div>
        </div>

        <div class="actions">
          <van-button size="small" plain type="danger" @click="onRemove(fav)">取消收藏</van-button>
        </div>
      </div>

      <van-empty v-if="!list.length && !loading" description="还没有收藏任何商品" />
    </van-list>
  </div>
</template>

<style scoped>
.favorites-page {
  min-height: 100%;
  padding-bottom: 20px;
}

.card {
  background: #fff;
  margin: 12px;
  border-radius: 12px;
  padding: 12px;
}

.card-body {
  display: flex;
  gap: 12px;
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.title {
  font-size: 14px;
  line-height: 1.5;
}

.meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price {
  color: #ee0a24;
  font-weight: 600;
}

.condition {
  font-size: 11px;
  color: #969799;
  background: #f2f3f5;
  border-radius: 4px;
  padding: 1px 6px;
}

.sub {
  font-size: 12px;
  color: #969799;
}

.img-placeholder {
  width: 80px;
  height: 80px;
  background: #f2f3f5;
  color: #969799;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}
</style>
