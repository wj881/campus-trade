<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getAdminOrders } from '@/api/admin'

const statusMap = {
  1: { label: '待确认', tag: 'warning' },
  2: { label: '待付款', tag: 'warning' },
  3: { label: '待交付', tag: 'primary' },
  4: { label: '待收货', tag: 'primary' },
  5: { label: '已完成', tag: 'success' },
  6: { label: '已取消', tag: 'info' },
  7: { label: '退款申诉中', tag: 'danger' }
}
const statusOptions = Object.entries(statusMap).map(([value, v]) => ({
  value: Number(value),
  label: v.label
}))

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const filters = reactive({ status: '', keyword: '' })

const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const loadList = async () => {
  loading.value = true
  try {
    const data = await getAdminOrders({
      status: filters.status || undefined,
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

const onSearch = () => {
  page.value = 1
  loadList()
}

const onReset = () => {
  filters.status = ''
  filters.keyword = ''
  onSearch()
}

const onPageChange = (p) => {
  page.value = p
  loadList()
}

onMounted(loadList)
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
      <el-form-item label="关键词">
        <el-input
          v-model="filters.keyword"
          placeholder="订单号 / 商品标题"
          clearable
          style="width: 220px"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="onSearch">查询</el-button>
        <el-button :icon="Refresh" @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 订单表格 -->
    <el-table v-loading="loading" :data="list" border>
      <el-table-column label="订单号" width="190" prop="orderNo" />

      <el-table-column label="商品" min-width="210">
        <template #default="{ row }">
          <div class="product">
            <el-image v-if="row.productImage" :src="row.productImage" fit="cover" class="thumb" />
            <div v-else class="thumb-placeholder">无图</div>
            <div class="title">{{ row.productTitle }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="买家" width="120" prop="buyerNickname" />
      <el-table-column label="卖家" width="120" prop="sellerNickname" />

      <el-table-column label="金额" width="100">
        <template #default="{ row }">¥{{ row.totalAmount }}</template>
      </el-table-column>

      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="statusMap[row.status]?.tag">
            {{ statusMap[row.status]?.label || '未知' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="下单时间" width="160">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
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
  </el-card>
</template>

<style scoped>
.product {
  display: flex;
  align-items: center;
  gap: 10px;
}

.thumb {
  width: 56px;
  height: 56px;
  border-radius: 6px;
}

.thumb-placeholder {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  background: #f5f7fa;
  color: #c0c4cc;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  font-size: 13px;
  color: #303133;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
