<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showSuccessToast } from 'vant'
import { getMyProducts, offlineProduct, deleteProduct } from '@/api/product'

const router = useRouter()

const statusMap = {
  1: { label: '待审核', type: 'warning' },
  2: { label: '在售', type: 'success' },
  3: { label: '已售出', type: 'default' },
  4: { label: '已下架', type: 'info' },
  5: { label: '审核驳回', type: 'danger' }
}

const conditionMap = {
  1: '全新',
  2: '几乎全新',
  3: '轻微使用',
  4: '明显使用'
}

const tabs = [
  { value: '', label: '全部' },
  { value: 1, label: '待审核' },
  { value: 2, label: '在售' },
  { value: 3, label: '已售出' },
  { value: 4, label: '已下架' },
  { value: 5, label: '审核驳回' }
]

const status = ref('')
const list = ref([])
const page = ref(1)
const finished = ref(false)
const loading = ref(false)

const canOffline = (item) => [1, 2].includes(item.status)
const canDelete = (item) => item.status !== 3

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
    const data = await getMyProducts({
      status: status.value || undefined,
      page: page.value,
      pageSize: 10
    })
    list.value.push(...(data.list || []))
    finished.value = list.value.length >= (data.total || 0)
    page.value++
  } catch {
    finished.value = true
  } finally {
    loading.value = false
  }
}

const onOffline = async (item) => {
  try {
    await showConfirmDialog({ title: '下架商品', message: `确认下架「${item.title}」？下架后他人将不可见。` })
    await offlineProduct(item.id)
    showSuccessToast('已下架')
    resetAndLoad()
  } catch {
    // 取消或拦截器提示
  }
}

const onDelete = async (item) => {
  try {
    await showConfirmDialog({ title: '删除商品', message: `确认删除「${item.title}」？删除后不可恢复。` })
    await deleteProduct(item.id)
    showSuccessToast('已删除')
    resetAndLoad()
  } catch {
    // 取消或拦截器提示
  }
}

const goDetail = (id) => router.push(`/product/${id}`)

watch(status, resetAndLoad)
</script>

<template>
  <div class="my-products-page">
    <van-nav-bar title="我的发布" />

    <van-tabs v-model:active="status" sticky>
      <van-tab v-for="t in tabs" :key="t.value" :name="t.value" :title="t.label" />
    </van-tabs>

    <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="loadList">
      <div v-for="item in list" :key="item.id" class="card">
        <div class="card-body" @click="goDetail(item.id)">
          <van-image width="80" height="80" fit="cover" :src="item.images?.[0]">
            <template #error><div class="img-placeholder">无图</div></template>
          </van-image>
          <div class="info">
            <div class="title">{{ item.title }}</div>
            <div class="meta">
              <span class="price">¥{{ item.price }}</span>
              <span class="condition">{{ conditionMap[item.conditionLevel] || '成色未知' }}</span>
            </div>
            <div class="sub">
              <van-tag :type="statusMap[item.status]?.type" plain>{{ statusMap[item.status]?.label }}</van-tag>
              <span class="time">{{ item.createdAt?.slice(0, 10) }}</span>
            </div>
          </div>
        </div>

        <div class="actions">
          <van-button v-if="canOffline(item)" size="small" plain @click="onOffline(item)">下架</van-button>
          <van-button v-if="canDelete(item)" size="small" plain type="danger" @click="onDelete(item)">删除</van-button>
        </div>
      </div>

      <van-empty v-if="!list.length && !loading" description="还没有发布过闲置" />
    </van-list>
  </div>
</template>

<style scoped>
.my-products-page {
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.time {
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
