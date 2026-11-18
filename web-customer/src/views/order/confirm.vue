<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showSuccessToast, showToast } from 'vant'
import { getProductDetail } from '@/api/product'
import { createOrder } from '@/api/order'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const detail = ref(null)
const form = ref({
  tradeLocation: '',
  remark: '',
  paymentMethod: 1
})

const totalAmount = computed(() => (detail.value ? Number(detail.value.price) : 0))

const loadDetail = async () => {
  loading.value = true
  try {
    detail.value = await getProductDetail(route.params.productId)
    form.value.tradeLocation = detail.value.location || ''
  } catch {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

const onSubmit = async () => {
  if (!detail.value) return
  try {
    await createOrder({
      productId: detail.value.id,
      tradeLocation: form.value.tradeLocation,
      remark: form.value.remark,
      paymentMethod: form.value.paymentMethod
    })
    showSuccessToast('下单成功，等待卖家确认')
    router.replace('/orders')
  } catch {
    // 拦截器已提示
  }
}

onMounted(loadDetail)
</script>

<template>
  <div class="confirm-page">
    <van-nav-bar title="确认订单" left-arrow @click-left="router.back()" />

    <van-loading v-if="loading" class="loading" vertical>加载中...</van-loading>

    <template v-else-if="detail">
      <!-- 商品快照 -->
      <div class="card">
        <van-image width="80" height="80" fit="cover" :src="detail.images?.[0]">
          <template #error><div class="img-placeholder">无图</div></template>
        </van-image>
        <div class="info">
          <div class="title">{{ detail.title }}</div>
          <div class="price">¥{{ detail.price }}</div>
        </div>
      </div>

      <!-- 表单 -->
      <div class="card form">
        <van-field
          v-model="form.tradeLocation"
          label="交易地点"
          placeholder="约定面交地点"
          maxlength="100"
        />
        <van-field
          v-model="form.remark"
          label="买家备注"
          type="textarea"
          rows="2"
          autosize
          placeholder="留言给卖家（选填）"
          maxlength="200"
        />
        <van-field label="支付方式">
          <template #input>
            <van-radio-group v-model="form.paymentMethod" direction="horizontal">
              <van-radio :name="1">当面交易</van-radio>
              <van-radio :name="2">线上转账</van-radio>
            </van-radio-group>
          </template>
        </van-field>
      </div>
    </template>

    <van-empty v-else description="商品不存在或已下架" />

    <!-- 底部提交栏 -->
    <van-action-bar>
      <van-action-bar-price :price="totalAmount * 100" currency="¥" />
      <van-action-bar-button type="danger" text="提交订单" @click="onSubmit" />
    </van-action-bar>
  </div>
</template>

<style scoped>
.confirm-page {
  min-height: 100%;
  padding-bottom: 60px;
}

.loading {
  padding: 80px 0;
}

.card {
  background: #fff;
  margin: 12px;
  border-radius: 12px;
  padding: 14px;
  display: flex;
  gap: 12px;
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.title {
  font-size: 14px;
  line-height: 1.5;
}

.price {
  color: #ee0a24;
  font-weight: 600;
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

.form {
  flex-direction: column;
  gap: 8px;
}
</style>
