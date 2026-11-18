<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showSuccessToast, showToast } from 'vant'
import { getOrders, transitionOrder } from '@/api/order'

const router = useRouter()

const statusMap = {
  1: { label: '待确认', type: 'warning' },
  2: { label: '待付款', type: 'warning' },
  3: { label: '待交付', type: 'primary' },
  4: { label: '待收货', type: 'primary' },
  5: { label: '已完成', type: 'success' },
  6: { label: '已取消', type: 'default' },
  7: { label: '退款申诉中', type: 'danger' }
}

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 1, label: '待确认' },
  { value: 2, label: '待付款' },
  { value: 3, label: '待交付' },
  { value: 4, label: '待收货' },
  { value: 5, label: '已完成' },
  { value: 6, label: '已取消' },
  { value: 7, label: '退款申诉中' }
]

const role = ref('buyer')
const status = ref('')
const list = ref([])
const page = ref(1)
const finished = ref(false)
const loading = ref(false)

const reasonDialog = ref(false)
const reasonOrder = ref(null)
const reasonAction = ref('')
const reasonText = ref('')

const getActions = (order) => {
  const isBuyer = role.value === 'buyer'
  const acts = []
  if (isBuyer) {
    if (order.status === 2) acts.push({ action: 'pay', label: '付款', type: 'danger' })
    if (order.status === 4) acts.push({ action: 'complete', label: '确认收货', type: 'primary' })
    if ([3, 4].includes(order.status)) acts.push({ action: 'refund', label: '申请退款', type: 'default' })
    if ([1, 2, 3].includes(order.status)) acts.push({ action: 'cancel', label: '取消订单', type: 'default' })
  } else {
    if (order.status === 1) acts.push({ action: 'confirm', label: '接单', type: 'primary' })
    if (order.status === 3) acts.push({ action: 'deliver', label: '发货', type: 'primary' })
    if ([1, 2, 3].includes(order.status)) acts.push({ action: 'cancel', label: '取消订单', type: 'default' })
  }
  return acts
}

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
    const data = await getOrders({
      role: role.value,
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

const onAction = async (order, act) => {
  // 取消 / 退款需要填写原因，走弹窗；其余二次确认后直接提交
  if (act.action === 'cancel' || act.action === 'refund') {
    reasonOrder.value = order
    reasonAction.value = act.action
    reasonText.value = ''
    reasonDialog.value = true
    return
  }
  try {
    await showConfirmDialog({ title: '操作确认', message: `确认「${act.label}」该订单？` })
    await transitionOrder(order.id, act.action)
    showSuccessToast('操作成功')
    resetAndLoad()
  } catch {
    // 取消或拦截器提示
  }
}

const confirmReason = async () => {
  try {
    await transitionOrder(reasonOrder.value.id, reasonAction.value, {
      cancelReason: reasonText.value
    })
    showSuccessToast('操作成功')
    reasonDialog.value = false
    resetAndLoad()
  } catch {
    // 拦截器已提示
  }
}

const goDetail = (id) => router.push(`/product/${id}`)

watch(role, resetAndLoad)
watch(status, resetAndLoad)
</script>

<template>
  <div class="order-page">
    <van-nav-bar title="我的订单" />

    <van-tabs v-model:active="role" sticky>
      <van-tab name="buyer">我买入的</van-tab>
      <van-tab name="seller">我卖出的</van-tab>
    </van-tabs>

    <van-dropdown-menu>
      <van-dropdown-item v-model="status" :options="statusOptions" />
    </van-dropdown-menu>

    <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="loadList">
      <div v-for="order in list" :key="order.id" class="card">
        <div class="card-head">
          <span class="order-no">{{ order.orderNo }}</span>
          <van-tag :type="statusMap[order.status]?.type">{{ statusMap[order.status]?.label }}</van-tag>
        </div>

        <div class="card-body" @click="goDetail(order.productId)">
          <van-image width="72" height="72" fit="cover" :src="order.productImage">
            <template #error><div class="img-placeholder">无图</div></template>
          </van-image>
          <div class="info">
            <div class="title">{{ order.productTitle }}</div>
            <div class="party">
              {{ role === 'buyer' ? '卖家' : '买家' }}：{{ role === 'buyer' ? order.sellerNickname : order.buyerNickname || '匿名' }}
            </div>
            <div class="amount">¥{{ order.totalAmount }}</div>
          </div>
        </div>

        <div v-if="order.cancelReason" class="reason">原因：{{ order.cancelReason }}</div>

        <div class="actions">
          <van-button
            v-for="act in getActions(order)"
            :key="act.action"
            size="small"
            :type="act.type"
            plain
            @click="onAction(order, act)"
          >
            {{ act.label }}
          </van-button>
        </div>
      </div>

      <van-empty v-if="!list.length && !loading" description="暂无相关订单" />
    </van-list>

    <!-- 取消 / 退款原因弹窗 -->
    <van-dialog
      v-model:show="reasonDialog"
      :title="reasonAction === 'refund' ? '申请退款' : '取消订单'"
      show-cancel-button
      @confirm="confirmReason"
    >
      <div class="reason-form">
        <van-field
          v-model="reasonText"
          type="textarea"
          rows="3"
          autosize
          maxlength="200"
          placeholder="请填写原因（选填）"
        />
      </div>
    </van-dialog>
  </div>
</template>

<style scoped>
.order-page {
  min-height: 100%;
  padding-bottom: 20px;
}

.card {
  background: #fff;
  margin: 12px;
  border-radius: 12px;
  padding: 12px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.order-no {
  font-size: 12px;
  color: #969799;
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

.party {
  font-size: 12px;
  color: #969799;
}

.amount {
  color: #ee0a24;
  font-weight: 600;
}

.img-placeholder {
  width: 72px;
  height: 72px;
  background: #f2f3f5;
  color: #969799;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reason {
  margin-top: 8px;
  font-size: 12px;
  color: #969799;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

.reason-form {
  padding: 10px 16px;
}
</style>
