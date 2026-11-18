<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { useAuthStore } from '@/store/auth'
import { getAdminUsers, updateUserStatus, updateUserRole } from '@/api/admin'

const authStore = useAuthStore()

const roleMap = {
  1: { label: '学生', tag: 'info' },
  2: { label: '管理员', tag: 'primary' }
}
const statusMap = {
  1: { label: '正常', tag: 'success' },
  0: { label: '已封禁', tag: 'danger' }
}

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const filters = reactive({
  keyword: '',
  role: '',
  status: ''
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
    const data = await getAdminUsers({
      keyword: filters.keyword || undefined,
      role: filters.role || undefined,
      status: filters.status === '' ? undefined : filters.status,
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
  filters.keyword = ''
  filters.role = ''
  filters.status = ''
  onSearch()
}

const onPageChange = (p) => {
  page.value = p
  loadList()
}

const isSelf = (row) => row.id === authStore.user?.id

// 封禁 / 解禁
const onToggleStatus = async (row) => {
  const next = row.status === 1 ? 0 : 1
  const action = next === 0 ? '封禁' : '解禁'
  try {
    await ElMessageBox.confirm(
      `确认${action}用户「${row.nickname || row.username}」？`,
      `${action}用户`,
      { type: 'warning', confirmButtonText: action, cancelButtonText: '取消' }
    )
    await updateUserStatus(row.id, { status: next })
    ElMessage.success(`${action}成功`)
    loadList()
  } catch {
    // 取消或拦截器已提示
  }
}

// 设为管理员
const onPromote = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确认将「${row.nickname || row.username}」设为管理员？`,
      '角色调整',
      { type: 'warning', confirmButtonText: '设为管理员', cancelButtonText: '取消' }
    )
    await updateUserRole(row.id, { role: 2 })
    ElMessage.success('已设为管理员')
    loadList()
  } catch {
    // 取消或拦截器已提示
  }
}

onMounted(loadList)
</script>

<template>
  <el-card>
    <!-- 筛选区 -->
    <el-form :inline="true" @submit.prevent>
      <el-form-item label="关键词">
        <el-input
          v-model="filters.keyword"
          placeholder="账号 / 昵称 / 手机号"
          clearable
          style="width: 200px"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="角色">
        <el-select v-model="filters.role" placeholder="全部" clearable style="width: 130px">
          <el-option label="学生" :value="1" />
          <el-option label="管理员" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="filters.status" placeholder="全部" clearable style="width: 130px">
          <el-option label="正常" :value="1" />
          <el-option label="已封禁" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="onSearch">查询</el-button>
        <el-button :icon="Refresh" @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 用户表格 -->
    <el-table v-loading="loading" :data="list" border>
      <el-table-column label="账号" width="140" prop="username" />
      <el-table-column label="昵称" width="140" prop="nickname" />
      <el-table-column label="手机号" width="140">
        <template #default="{ row }">{{ row.phone || '-' }}</template>
      </el-table-column>
      <el-table-column label="角色" width="100">
        <template #default="{ row }">
          <el-tag :type="roleMap[row.role]?.tag">{{ roleMap[row.role]?.label || '未知' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusMap[row.status]?.tag">{{ statusMap[row.status]?.label || '未知' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发布商品" width="90" prop="productCount" />
      <el-table-column label="注册时间" width="160">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <template v-if="row.role === 2 || isSelf(row)">
            <span class="muted">—</span>
          </template>
          <template v-else>
            <el-button link :type="row.status === 1 ? 'danger' : 'success'" @click="onToggleStatus(row)">
              {{ row.status === 1 ? '封禁' : '解禁' }}
            </el-button>
            <el-button link type="primary" @click="onPromote(row)">设为管理员</el-button>
          </template>
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
</template>

<style scoped>
.muted {
  color: #c0c4cc;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
