<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import {
  getAdminCategories,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  deleteCategory
} from '@/api/admin'

const statusMap = {
  1: { label: '启用', tag: 'success' },
  0: { label: '禁用', tag: 'info' }
}

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const filters = reactive({
  keyword: '',
  status: ''
})

// 弹窗
const dialogVisible = ref(false)
const editingId = ref(null)
const form = reactive({
  name: '',
  sort: 0,
  status: 1
})
const formRef = ref(null)

const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const loadList = async () => {
  loading.value = true
  try {
    const data = await getAdminCategories({
      keyword: filters.keyword || undefined,
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
  filters.status = ''
  onSearch()
}

const onPageChange = (p) => {
  page.value = p
  loadList()
}

const openCreate = () => {
  editingId.value = null
  form.name = ''
  form.sort = 0
  form.status = 1
  dialogVisible.value = true
}

const openEdit = (row) => {
  editingId.value = row.id
  form.name = row.name
  form.sort = row.sort
  form.status = row.status
  dialogVisible.value = true
}

const onSubmit = async () => {
  try {
    await formRef.value?.validate()
    const payload = {
      name: form.name.trim(),
      sort: Number(form.sort) || 0,
      status: Number(form.status)
    }
    if (editingId.value) {
      await updateCategory(editingId.value, payload)
      ElMessage.success('分类已更新')
    } else {
      await createCategory(payload)
      ElMessage.success('分类已创建')
    }
    dialogVisible.value = false
    loadList()
  } catch {
    // 校验未通过或拦截器已提示
  }
}

const onToggleStatus = async (row) => {
  const next = row.status === 1 ? 0 : 1
  const action = next === 1 ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(`确认${action}分类「${row.name}」？`, `${action}分类`, {
      type: 'warning',
      confirmButtonText: action,
      cancelButtonText: '取消'
    })
    await updateCategoryStatus(row.id, { status: next })
    ElMessage.success(`${action}成功`)
    loadList()
  } catch {
    // 取消或拦截器已提示
  }
}

const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除分类「${row.name}」？该分类下存在商品时不可删除。`, '删除分类', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await deleteCategory(row.id)
    ElMessage.success('分类已删除')
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
          placeholder="分类名称"
          clearable
          style="width: 200px"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="filters.status" placeholder="全部" clearable style="width: 130px">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="onSearch">查询</el-button>
        <el-button :icon="Refresh" @click="onReset">重置</el-button>
        <el-button type="success" :icon="Plus" @click="openCreate">新增分类</el-button>
      </el-form-item>
    </el-form>

    <!-- 分类表格 -->
    <el-table v-loading="loading" :data="list" border>
      <el-table-column label="分类名称" min-width="180" prop="name" />
      <el-table-column label="排序" width="90" prop="sort" />
      <el-table-column label="商品数" width="90" prop="productCount" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusMap[row.status]?.tag">{{ statusMap[row.status]?.label || '未知' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="160">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link :type="row.status === 1 ? 'warning' : 'success'" @click="onToggleStatus(row)">
            {{ row.status === 1 ? '禁用' : '启用' }}
          </el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
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

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑分类' : '新增分类'" width="420px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" maxlength="20" placeholder="2-20 字" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onSubmit">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<style scoped>
.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
