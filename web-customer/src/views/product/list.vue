<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getProducts, getCategories } from '@/api/product'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

// ---------- 筛选条件 ----------
const keyword = ref('')
const activeCategory = ref(0)
const sort = ref('newest')
const categories = ref([])

const sortOptions = [
  { text: '最新发布', value: 'newest' },
  { text: '价格最低', value: 'priceAsc' },
  { text: '价格最高', value: 'priceDesc' },
  { text: '最多浏览', value: 'views' }
]

const conditionMap = {
  1: '全新',
  2: '几乎全新',
  3: '轻微使用',
  4: '明显使用'
}

// ---------- 分页列表 ----------
const list = ref([])
const page = ref(1)
const pageSize = 10
const finished = ref(false)
const loading = ref(false)
const refreshing = ref(false)

const buildParams = () => ({
  page: page.value,
  pageSize,
  keyword: keyword.value.trim() || undefined,
  categoryId: activeCategory.value || undefined,
  sort: sort.value
})

const loadCategories = async () => {
  try {
    const data = await getCategories()
    categories.value = data || []
  } catch {
    categories.value = []
  }
}

const onLoad = async () => {
  loading.value = true
  try {
    const data = await getProducts(buildParams())
    const items = data.list || []
    list.value.push(...items)
    finished.value = list.value.length >= (data.total || 0)
    page.value += 1
  } catch {
    finished.value = true
  } finally {
    loading.value = false
  }
}

/** 重置到第一页并重新加载 */
const reload = async () => {
  page.value = 1
  list.value = []
  finished.value = false
  loading.value = false
  await onLoad()
}

const onSearch = () => reload()
const onCategory = (id) => {
  activeCategory.value = id
  reload()
}
const onSortChange = () => reload()
const onRefresh = async () => {
  await reload()
  refreshing.value = false
}

const onDetail = (item) => {
  router.push(`/product/${item.id}`)
}

const goLogin = () => {
  router.push('/login')
}

const goPublish = () => {
  router.push('/publish')
}

const goProfile = () => {
  if (userStore.isLogin) router.push('/profile')
  else goLogin()
}

onMounted(loadCategories)
</script>

<template>
  <div class="list-page">
    <van-nav-bar title="闲置集市">
      <template #right>
        <van-icon name="plus" size="20" class="entry" @click="goPublish" />
        <span v-if="userStore.isLogin" class="entry" @click="goProfile">{{ userStore.user?.nickname || '我的' }}</span>
        <span v-else class="entry" @click="goLogin">登录</span>
      </template>
    </van-nav-bar>

    <van-search
      v-model="keyword"
      placeholder="搜索教材、数码、生活用品"
      show-action
      @search="onSearch"
    >
      <template #action>
        <div class="search-btn" @click="onSearch">搜索</div>
      </template>
    </van-search>

    <!-- 分类横向标签 -->
    <div class="category-bar">
      <div
        class="category-item"
        :class="{ active: activeCategory === 0 }"
        @click="onCategory(0)"
      >
        全部
      </div>
      <div
        v-for="c in categories"
        :key="c.id"
        class="category-item"
        :class="{ active: activeCategory === c.id }"
        @click="onCategory(c.id)"
      >
        {{ c.name }}
      </div>
    </div>

    <!-- 排序 -->
    <van-dropdown-menu>
      <van-dropdown-item v-model="sort" :options="sortOptions" @change="onSortChange" />
    </van-dropdown-menu>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div class="grid">
          <div v-for="item in list" :key="item.id" class="card" @click="onDetail(item)">
            <div class="card-img">
              <img v-if="item.images && item.images[0]" :src="item.images[0]" :alt="item.title" />
              <div v-else class="img-placeholder">暂无图片</div>
            </div>
            <div class="card-body">
              <div class="card-title">{{ item.title }}</div>
              <div class="card-meta">
                <span class="price">{{ item.price }}</span>
                <span class="condition">{{ conditionMap[item.conditionLevel] || '成色未知' }}</span>
              </div>
              <div class="card-footer">
                <span class="location">{{ item.location || '校内面交' }}</span>
                <span class="views">浏览 {{ item.viewCount || 0 }}</span>
              </div>
            </div>
          </div>
        </div>

        <van-empty v-if="finished && list.length === 0" description="暂无相关闲置" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<style scoped>
.list-page {
  min-height: 100%;
  padding-bottom: 24px;
}

.entry {
  font-size: 14px;
  color: var(--brand-primary);
}

.search-btn {
  color: var(--brand-primary);
  font-size: 14px;
  padding: 0 4px;
}

.category-bar {
  display: flex;
  gap: 10px;
  padding: 10px 16px;
  overflow-x: auto;
  white-space: nowrap;
  background: #fff;
}

.category-item {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  color: #646566;
  background: #f2f3f5;
}

.category-item.active {
  color: #fff;
  background: var(--brand-primary);
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 12px;
}

.card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.card-img {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #f7f8fa;
}

.card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c8c9cc;
  font-size: 13px;
}

.card-body {
  padding: 10px;
}

.card-title {
  font-size: 14px;
  line-height: 1.4;
  height: 2.8em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.condition {
  font-size: 11px;
  color: #969799;
  background: #f2f3f5;
  border-radius: 4px;
  padding: 1px 6px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 11px;
  color: #969799;
}
</style>
