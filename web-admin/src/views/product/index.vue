<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import {
  getAdminProducts,
  getCategories,
  offlineAdminProduct,
  deleteAdminProduct
} from '@/api/admin'

const statusMap = {
  1: { label: '待审核', tag: 'warning' },
  2: { label: '在售', tag: 'success' },
  3: { label: '已售出', tag: 'info' },
  4: { label: '已下架', tag: 'info' },
  5: { label: '已驳回', tag: 'danger' }
}
const statusOptions = Object.entries(statusMap).map(([value, v]) => ({
  value: Number(value),
  label: v.label
}))

const conditionMap = {
  1: '全新',
  2: '几乎全新',
  3: '轻微使用',
  4: '明显使用'
}

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const categories = ref([])

const filters = reactive({
  status: '',
  categoryId: '',
  keyword: ''
})

// 详情弹窗
const detailVisible = ref(false)
const detailRow = ref(null)

const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const loadList = async () => {
  loading.value = true
  try {
    const data = await getAdminProducts({
      status: filters.status || undefined,
      categoryId: filters.categoryId || undefined,
      keyword: filters.keyword || undefined,
      page: page.value,
      pageSize: pageSize.value
    })
    list.value = data.list || []
    total.value = data.total || 0
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    categories.value = (await getCategories()) || []
  } catch {
    categories.value = []
  }
}

const onSearch = () => {
  page.value = 1
  loadList()
}

const onReset = () => {
  filters.status = ''
  filters.categoryId = ''
  filters.keyword = ''
  onSearch()
}

const onPageChange = (p) => {
  page.value = p
  loadList()
}

const openDetail = (row) => {
  detailRow.value = row
  detailVisible.value = true
}

const onOffline = async (row) => {
  try {
    await ElMessageBox.confirm(`确认下架商品「${row.title}」？下架后他人将不可见。`, '下架商品', {
      type: 'warning',
      confirmButtonText: '下架',
      cancelButtonText: '取消'
    })
    await offlineAdminProduct(row.id)
    ElMessage.success('已下架')
    loadList()
  } catch {
    // 取消或拦截器已提示
  }
}

const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除商品「${row.title}」？删除后不可恢复。`, '删除商品', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await deleteAdminProduct(row.id)
    ElMessage.success('已删除')
    loadList()
  } catch {
    // 取消或拦截器已提示
  }
}

onMounted(() => {
  loadCategories()
  loadList()
})
</script>

<template>
  <el-card>
    <!-- 筛选区 -->
    <el-form :inline="true" @submit.prevent>
      <el-form-item label="状态">
        <el-select v-model="filters.status" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="分类">
        <el-select v-model="filters.categoryId" placeholder="全部分类" clearable style="width: 160px">
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键词">
        <el-input
          v-model="filters.keyword"
          placeholder="标题 / 描述"
          clearable
          style="width: 200px"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="onSearch">查询</el-button>
        <el-button :icon="Refresh" @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 商品表格 -->
    <el-table v-loading="loading" :data="list" border>
      <el-table-column label="商品图" width="90">
        <template #default="{ row }">
          <el-image v-if="row.images && row.images[0]" :src="row.images[0]" fit="cover" class="thumb" />
          <div v-else class="thumb-placeholder">无图</div>
        </template>
      </el-table-column>

      <el-table-column label="标题" min-width="210">
        <template #default="{ row }">
          <div class="title">{{ row.title }}</div>
          <div class="cat">{{ row.categoryName }}</div>
        </template>
      </el-table-column>

      <el-table-column label="发布人" width="120" prop="sellerNickname" />

      <el-table-column label="价格" width="100">
        <template #default="{ row }">¥{{ row.price }}</template>
      </el-table-column>

      <el-table-column label="发布时间" width="160">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>

      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusMap[row.status]?.tag">{{ statusMap[row.status]?.label || '未知' }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">查看</el-button>
          <el-button v-if="[1, 2].includes(row.status)" link type="warning" @click="onOffline(row)">下架</el-button>
          <el-button v-if="row.status !== 3" link type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      class="pagination"
      background
      layout="total, prev, pager, next"
      :total="total"
      :page-size="pageSize"
      :current-page="page"
      @current-change="onPageChange"
    />

    <!-- 商品详情弹窗 -->
    <el-dialog v-model="detailVisible" title="商品详情" width="520px">
      <div v-if="detailRow" class="detail">
        <el-image
          v-if="detailRow.images && detailRow.images[0]"
          :src="detailRow.images[0]"
          fit="cover"
          class="detail-img"
        />
        <el-descriptions :column="1" border>
          <el-descriptions-item label="标题">{{ detailRow.title }}</el-descriptions-item>
          <el-descriptions-item label="价格">¥{{ detailRow.price }}</el-descriptions-item>
          <el-descriptions-item label="成色">{{ conditionMap[detailRow.conditionLevel] || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="分类">{{ detailRow.categoryName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="发布人">{{ detailRow.sellerNickname || '匿名' }}</el-descriptions-item>
          <el-descriptions-item label="交易地点">{{ detailRow.location || '-' }}</el-descriptions-item>
          <el-descriptions-item label="描述">{{ detailRow.description || '无' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </el-card>
</template>

<style scoped>
.thumb {
  width: 72px;
  height: 72px;
  border-radius: 6px;
}

.thumb-placeholder {
  width: 72px;
  height: 72px;
  border-radius: 6px;
  background: #f5f7fa;
  color: #c0c4cc;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  font-weight: 500;
  color: #303133;
}

.cat {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.detail-img {
  width: 100%;
  height: 220px;
  border-radius: 8px;
  margin-bottom: 16px;
}
</style>
