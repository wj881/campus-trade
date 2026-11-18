<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getAdminProducts, auditProduct, getCategories } from '@/api/admin'

// 商品状态 → 文案 / 标签颜色
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

// 通过审核
const onApprove = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确认通过商品「${row.title}」的审核？通过后将上架展示。`,
      '审核通过',
      { type: 'success', confirmButtonText: '通过', cancelButtonText: '取消' }
    )
    await auditProduct(row.id, { status: 1 })
    ElMessage.success('已通过并上架')
    loadList()
  } catch {
    // 取消或请求失败，拦截器已提示
  }
}

// 驳回
const rejectDialog = ref(false)
const rejectRow = ref(null)
const rejectRemark = ref('')

const openReject = (row) => {
  rejectRow.value = row
  rejectRemark.value = ''
  rejectDialog.value = true
}

const confirmReject = async () => {
  try {
    await auditProduct(rejectRow.value.id, { status: 2, remark: rejectRemark.value })
    ElMessage.success('已驳回')
    rejectDialog.value = false
    loadList()
  } catch {
    // 拦截器已提示
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
        <el-select
          v-model="filters.status"
          placeholder="全部"
          clearable
          style="width: 140px"
        >
          <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="分类">
        <el-select
          v-model="filters.categoryId"
          placeholder="全部分类"
          clearable
          style="width: 160px"
        >
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
          <el-image
            v-if="row.images && row.images[0]"
            :src="row.images[0]"
            fit="cover"
            class="thumb"
          />
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
          <el-tag :type="statusMap[row.status]?.tag">
            {{ statusMap[row.status]?.label || '未知' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 1">
            <el-button link type="success" @click="onApprove(row)">通过</el-button>
            <el-button link type="danger" @click="openReject(row)">驳回</el-button>
          </template>
          <span v-else class="muted">—</span>
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
  </el-card>

  <!-- 驳回原因弹窗 -->
  <el-dialog v-model="rejectDialog" title="驳回原因" width="420px">
    <el-input
      v-model="rejectRemark"
      type="textarea"
      rows="3"
      maxlength="200"
      placeholder="请填写驳回原因（选填）"
    />
    <template #footer>
      <el-button @click="rejectDialog = false">取消</el-button>
      <el-button type="danger" @click="confirmReject">确认驳回</el-button>
    </template>
  </el-dialog>
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

.muted {
  color: #c0c4cc;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
