# 校园闲置交易平台 · C 端（web-customer）

Vue3 + Vite + Vant 4 + Axios + Pinia + Vue Router，对接 Express + Prisma 后端（接口前缀 `/api/v1`，见上级目录 `API.md`）。

## 目录结构

```
web-customer/
├── index.html
├── vite.config.js          # 端口 5173，/api 代理到 localhost:3000
├── .env.development        # VITE_API_BASE_URL=/api/v1
├── package.json
└── src/
    ├── main.js             # 入口：注册 Pinia / Router / Vant
    ├── App.vue
    ├── router/index.js     # 路由与标题守卫
    ├── store/user.js       # 登录态（token + user），localStorage 持久化
    ├── utils/storage.js
    ├── api/
    │   ├── request.js      # Axios 实例：Token 注入、统一解包、401 跳登录
    │   ├── auth.js         # 登录 / 注册 / 当前用户
    │   └── product.js      # 商品列表 / 详情 / 分类
    ├── views/
    │   ├── login/index.vue # 登录页
    │   └── product/list.vue# 商品列表页（搜索 / 分类 / 排序 / 分页）
    └── styles/index.css
```

## 启动

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 生产构建，输出 dist/
```

> 后端 Express 默认运行在 `http://localhost:3000`，开发态由 Vite 代理 `/api`，无需额外配置跨域。

## 已实现页面

| 页面 | 路由 | 说明 |
|---|---|---|
| 登录页 | `/login` | 账号密码校验、登录态持久化、回跳 |
| 商品列表 | `/products` | 关键词搜索、分类筛选、排序、下拉刷新、上拉分页、空状态 |

## 待接入（后续迭代）

- 商品详情、发布商品、收藏、下单与订单列表、个人中心
- 按需引入 Vant 组件（`unplugin-vue-components` + `@vant/auto-import-resolver`）
