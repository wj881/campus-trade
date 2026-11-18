# 校园闲置交易平台 · 后台管理端（web-admin）

Vue 3 + Vite + Element Plus + Pinia + Vue Router，对接 Express 后端（接口前缀 `/api/v1`）。当前实现【商品审核】，商品管理、分类管理为占位页。

## 技术栈

- Vue 3.4 + Vite 5.4
- Element Plus 2.8 + @element-plus/icons-vue
- Pinia 2.2（登录态持久化）
- Vue Router 4.4（登录 / 管理员守卫）
- Axios 1.7（统一封装鉴权、解包、错误提示）

## 目录结构

```
web-admin/
├── index.html
├── vite.config.js          # 别名 @、开发代理 /api、/uploads → localhost:3000
├── .env.example             # VITE_API_BASE_URL=/api/v1
├── src/
│   ├── main.js              # 入口：注册 Pinia / Router / Element Plus / 图标
│   ├── App.vue
│   ├── router/index.js      # 路由表 + 登录态、管理员身份守卫
│   ├── store/auth.js         # token / user 持久化（localStorage: admin_auth）
│   ├── api/
│   │   ├── request.js       # axios 实例：Token 注入、解包、401/403 处理
│   │   └── admin.js         # 登录、审核列表、审核操作、分类下拉
│   ├── layouts/AdminLayout.vue  # 侧边栏 + 顶部 Header 布局
│   └── views/
│       ├── login/index.vue   # 登录页（role===2 才放行）
│       ├── audit/index.vue   # 商品审核列表（筛选 / 表格 / 状态标签 / 通过驳回 / 分页）
│       ├── product/index.vue # 商品管理（占位）
│       └── category/index.vue# 分类管理（占位）
└── package.json
```

## 环境准备

1. 后端服务先启动在 `http://localhost:3000`（见上级 `server/README.md`），并已写入种子管理员账号 `admin / admin123`（role=2）。
2. Node.js ≥ 18。

## 启动与构建

```bash
# 安装依赖
npm install

# 开发（默认 5174 端口，/api 与 /uploads 代理到 3000）
npm run dev

# 生产构建
npm run build

# 预览构建产物
npm run preview
```

## 登录与权限

- 登录复用后端 `POST /auth/login`；前端校验返回的 `user.role === 2`（管理员），普通学生角色即使登录成功也提示「该账号不是管理员」并拒绝进入。
- 路由守卫：未登录访问 `/admin/**` 跳 `/login`；已登录但非管理员清除本地态并跳登录。
- 请求头自动携带 `Authorization: Bearer <token>`；后端 `adminRequired` 中间件再次校验，学生角色访问 `/admin/xxx` 返回 `40301`。

## 对接接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/v1/auth/login` | 登录，返回 `{ token, user }` |
| GET | `/api/v1/admin/products` | 审核列表：`status / categoryId / keyword / page / pageSize` |
| PUT | `/api/v1/admin/products/:id/audit` | 审核：`{ status: 1通过 \| 2驳回, remark? }` |
| GET | `/api/v1/categories` | 分类下拉选项 |

## 商品状态标签映射

| status | 含义 | el-tag type |
|---|---|---|
| 1 | 待审核 | warning（黄） |
| 2 | 在售 | success（绿） |
| 3 | 已售出 | info（灰） |
| 4 | 已下架 | info（灰） |
| 5 | 已驳回 | danger（红） |

仅 `status === 1`（待审核）的行展示「通过 / 驳回」操作按钮，其余状态显示占位「—」。通过走二次确认弹窗；驳回弹窗填写原因（选填）后提交。

## 说明与优化项

- 当前 Element Plus 为全量引入，生产主 chunk 偏大（构建仅警告，不影响运行）；后续可改为按需引入，或在 `vite.config.js` 配置 `manualChunks` 拆分第三方依赖。
- 商品管理、分类管理、订单管理、用户管理为待扩展模块。
