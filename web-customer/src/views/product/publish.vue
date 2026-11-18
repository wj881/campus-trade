<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showSuccessToast, showToast } from 'vant'
import {
  getCategories,
  uploadImage,
  createProduct
} from '@/api/product'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 未登录直接跳登录页，带回跳地址
if (!userStore.isLogin) {
  router.replace({ path: '/login', query: { redirect: route.fullPath } })
}

const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  title: '',
  categoryId: null,
  categoryName: '',
  price: '',
  originalPrice: '',
  conditionLevel: 2,
  description: '',
  location: '',
  contact: ''
})

// ---------- 分类 ----------
const categories = ref([])
const showCategory = ref(false)
const categoryColumns = computed(() =>
  categories.value.map((c) => ({ text: c.name, value: c.id }))
)

const loadCategories = async () => {
  try {
    categories.value = (await getCategories()) || []
  } catch {
    categories.value = []
  }
}

const onConfirmCategory = ({ selectedOptions }) => {
  const opt = selectedOptions[0]
  if (opt) {
    form.categoryId = opt.value
    form.categoryName = opt.text
  }
  showCategory.value = false
}

// ---------- 图片上传 ----------
const fileList = ref([])

const afterRead = async (files) => {
  const list = Array.isArray(files) ? files : [files]
  for (const file of list) {
    file.status = 'uploading'
    file.message = '上传中...'
    try {
      const res = await uploadImage(file.file)
      file.url = res.url
      file.status = 'done'
    } catch {
      file.status = 'failed'
      file.message = '上传失败'
    }
  }
}

// ---------- 校验规则 ----------
const rules = {
  title: [
    { required: true, message: '请输入商品标题' },
    {
      validator: (v) => v && v.trim().length >= 2 && v.trim().length <= 30,
      message: '标题长度需为 2-30 字'
    }
  ],
  categoryName: [{ required: true, message: '请选择商品分类' }],
  price: [
    { required: true, message: '请输入价格' },
    { validator: (v) => Number(v) > 0, message: '价格需大于 0' }
  ],
  conditionLevel: [{ required: true, message: '请选择成色' }]
}

// ---------- 提交 ----------
const onSubmit = async () => {
  if (submitting.value) return
  const images = fileList.value
    .filter((f) => f.status === 'done')
    .map((f) => f.url)

  submitting.value = true
  try {
    await createProduct({
      categoryId: form.categoryId,
      title: form.title.trim(),
      price: Number(form.price).toFixed(2),
      originalPrice: form.originalPrice ? Number(form.originalPrice).toFixed(2) : undefined,
      conditionLevel: form.conditionLevel,
      description: form.description.trim(),
      location: form.location.trim(),
      contact: form.contact.trim(),
      images
    })
    showSuccessToast('发布成功，等待审核')
    router.replace('/products')
  } catch {
    // 错误提示已在拦截器统一处理
  } finally {
    submitting.value = false
  }
}

onMounted(loadCategories)
</script>

<template>
  <div class="publish-page">
    <van-nav-bar title="发布闲置" left-arrow @click-left="router.back()" />

    <van-form ref="formRef" @submit="onSubmit">
      <!-- 商品图片 -->
      <van-cell-group title="商品图片（最多 3 张）" class="section">
        <van-uploader
          v-model="fileList"
          :max-count="3"
          accept="image/*"
          :after-read="afterRead"
        />
      </van-cell-group>

      <!-- 基本信息 -->
      <van-cell-group title="基本信息" class="section">
        <van-field
          v-model="form.title"
          label="标题"
          placeholder="2-30 字，说清商品核心信息"
          maxlength="30"
          :rules="rules.title"
        />
        <van-field
          v-model="form.categoryName"
          label="分类"
          placeholder="请选择分类"
          is-link
          readonly
          :rules="rules.categoryName"
          @click="showCategory = true"
        />
        <van-field
          v-model="form.price"
          type="number"
          label="价格"
          placeholder="售价（元）"
          :rules="rules.price"
        >
          <template #button><span class="prefix">¥</span></template>
        </van-field>
        <van-field
          v-model="form.originalPrice"
          type="number"
          label="原价"
          placeholder="选填，划线价"
        />
        <van-field name="conditionLevel" label="成色" :model-value="form.conditionLevel" :rules="rules.conditionLevel">
          <template #input>
            <van-radio-group v-model="form.conditionLevel" direction="horizontal">
              <van-radio :name="1">全新</van-radio>
              <van-radio :name="2">几乎全新</van-radio>
              <van-radio :name="3">轻微使用</van-radio>
              <van-radio :name="4">明显使用</van-radio>
            </van-radio-group>
          </template>
        </van-field>
        <van-field
          v-model="form.description"
          label="描述"
          type="textarea"
          rows="4"
          maxlength="500"
          autosize
          placeholder="描述商品细节、入手渠道、转让原因等"
        />
        <van-field v-model="form.location" label="交易地点" placeholder="如：东校区宿舍楼下" />
        <van-field v-model="form.contact" label="联系方式" placeholder="微信 / QQ / 手机号" />
      </van-cell-group>

      <div class="submit-bar">
        <van-button round block type="primary" native-type="submit" :loading="submitting">
          提交发布
        </van-button>
      </div>
    </van-form>

    <!-- 分类选择弹层 -->
    <van-popup v-model:show="showCategory" position="bottom" round>
      <van-picker
        :columns="categoryColumns"
        title="选择分类"
        @confirm="onConfirmCategory"
        @cancel="showCategory = false"
      />
    </van-popup>
  </div>
</template>

<style scoped>
.publish-page {
  min-height: 100%;
  background: #f7f8fa;
  padding-bottom: 24px;
}

.section {
  margin-top: 12px;
}

.prefix {
  color: #646566;
  margin-right: 4px;
}

.submit-bar {
  padding: 20px 16px;
}
</style>
