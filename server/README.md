# 校园闲置交易平台 · 后端（server）

Express + Prisma + MySQL + JWT，对接 C 端 `web-customer`（接口前缀 `/api/v1`，字段约定见上级目录 `API.md`）。

## 技术栈

- Express 4（Web 框架）
- Prisma 5（ORM，MySQL）
- multer（本地上传图片）
- jsonwebtoken（JWT 鉴权）
- bcryptjs（密码哈希）
- cors / dotenv

## 目录结构

```
server/
├── prisma/
│   ├── schema.prisma      # 数据模型：User / Category / Product / ProductImage / Favorite
│   └── seed.js            # 种子数据：管理员 + 默认分类
├── public/
│   └── uploads/           # 本地上传图片存放目录（静态托管 /uploads）
├── src/
│   ├── index.js            # 启动入口
│   ├── app.js              # Express 实例、中间件、静态目录、路由挂载
│   ├── config/env.js       # 环境变量读取
│   ├── prisma/client.js    # PrismaClient 单例
│   ├── utils/
│   │   ├── response.js     # 统一响应 { code, message, data }
│   │   └── jwt.js          # 签发 / 校验 JWT
│   ├── middleware/
│   │   ├── auth.js         # authRequired / optionalAuth / adminRequired
│   │   └── errorHandler.js # 404 + 全局错误处理
│   ├── routes/index.js     # 路由总表
│   └── modules/
│       ├── auth/          # 登录
│       ├── product/       # 商品列表、详情、发布
│       ├── favorite/       # 收藏添加 / 取消 / 列表
│       ├── order/         # 下单、订单列表 / 详情、状态流转
│       ├── upload/         # 图片上传
│       ├── admin/          # 后台：商品审核列表、审核通过 / 驳回
│       └── category/      # 分类
├── .env.example
└── package.json
```

## 环境要求

- Node.js ≥ 18（推荐 20/22）
- MySQL 8.0

## 初始化数据库与启动

```bash
# 1. 安装依赖
npm install

# 2. 复制环境变量并修改数据库连接、JWT 密钥
cp .env.example .env

# 3. 生成 Prisma Client
npx prisma generate

# 4. 建库建表（二选一）
#    方式 A：按 schema 直接同步到数据库（适合起步 / 演示）
npx prisma db push
#    方式 B：生成并执行迁移（适合正式迭代）
npx prisma migrate dev --name init

# 5.（可选）写入种子数据：管理员 admin / admin123，8 个默认分类
npm run seed

# 6. 启动开发服务（自动监听改动）
npm run dev
```

服务默认运行在 `http://localhost:3000`，接口前缀 `http://localhost:3000/api/v1`。

## 已实现接口

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| POST | `/api/v1/auth/login` | 账号密码登录，返回 JWT | 公开 |
| POST | `/api/v1/auth/register` | 学生注册：用户名唯一校验、密码哈希，返回 JWT | 公开 |
| GET | `/api/v1/auth/me` | 当前登录用户安全信息 | 需登录 |
| GET | `/api/v1/products` | 商品分页列表：分类筛选、关键词搜索、排序 | 公开 |
| GET | `/api/v1/products/:id` | 商品详情，回传当前用户是否收藏 `favorited` | 可选登录 |
| POST | `/api/v1/products` | 发布商品，默认「待审核」，不直接上架 | 需登录 |
| GET | `/api/v1/users/me/products` | 我的发布：卖家本人全状态分页列表 | 需登录 |
| PATCH | `/api/v1/products/:id/offline` | 下架商品（卖家本人，已售出不可下架） | 需登录 |
| DELETE | `/api/v1/products/:id` | 删除商品（软删除，本人 / 管理员） | 需登录 |
| GET | `/api/v1/categories` | 分类列表（可按 status 过滤） | 公开 |
| POST | `/api/v1/upload` | 单图上传，存入 `public/uploads`，返回访问 URL | 需登录 |
| POST | `/api/v1/favorites` | 添加收藏（幂等，重复收藏不报错） | 需登录 |
| GET | `/api/v1/favorites` | 当前用户收藏分页列表 | 需登录 |
| DELETE | `/api/v1/favorites/:productId` | 取消收藏（幂等） | 需登录 |
| POST | `/api/v1/orders` | 创建订单（校验在售、非本人、无进行中订单） | 需登录 |
| GET | `/api/v1/orders` | 我的订单（买入 / 卖出、状态、订单号筛选，分页） | 需登录 |
| GET | `/api/v1/orders/:id` | 订单详情（交易双方 / 管理员） | 需登录 |
| PATCH | `/api/v1/orders/:id/confirm` | 卖家接单：1 待确认 → 2 待付款 | 需登录 |
| PATCH | `/api/v1/orders/:id/pay` | 买家付款：2 待付款 → 3 待交付 | 需登录 |
| PATCH | `/api/v1/orders/:id/deliver` | 卖家发货：3 待交付 → 4 待收货 | 需登录 |
| PATCH | `/api/v1/orders/:id/complete` | 买家确认收货：4 → 5 已完成，商品置已售出 | 需登录 |
| PATCH | `/api/v1/orders/:id/cancel` | 取消订单：1/2/3 → 6 已取消 | 需登录 |
| PATCH | `/api/v1/orders/:id/refund` | 买家申请退款：3/4 → 7 退款申诉中 | 需登录 |
| GET | `/api/v1/admin/products` | 后台商品分页列表：状态 / 分类 / 关键词筛选 | 需管理员 |
| PUT | `/api/v1/admin/products/:id/audit` | 审核商品：通过 / 驳回 | 需管理员 |
| PATCH | `/api/v1/admin/products/:id/offline` | 后台下架商品 | 需管理员 |
| DELETE | `/api/v1/admin/products/:id` | 后台删除商品（软删除，进行中订单拦截） | 需管理员 |
| GET | `/api/v1/admin/orders` | 后台订单分页列表：状态 / 关键词筛选 | 需管理员 |
| GET | `/api/v1/admin/users` | 后台用户分页列表：关键词 / 角色 / 状态筛选 | 需管理员 |
| PATCH | `/api/v1/admin/users/:id/status` | 封禁 / 解禁学生账号 | 需管理员 |
| PATCH | `/api/v1/admin/users/:id/role` | 学生 ⇄ 管理员角色调整 | 需管理员 |
| GET | `/api/v1/admin/categories` | 后台分类分页列表：名称 / 状态筛选 | 需管理员 |
| POST | `/api/v1/admin/categories` | 新增分类 | 需管理员 |
| PUT | `/api/v1/admin/categories/:id` | 编辑分类 | 需管理员 |
| PATCH | `/api/v1/admin/categories/:id/status` | 启用 / 禁用分类 | 需管理员 |
| DELETE | `/api/v1/admin/categories/:id` | 删除分类（下有商品禁止删除） | 需管理员 |

### GET /products 查询参数

| 参数 | 说明 |
|---|---|
| page | 页码，默认 1 |
| pageSize | 每页条数，默认 10，最大 50 |
| categoryId | 分类 ID 筛选 |
| keyword | 标题 / 描述关键词 |
| sort | `newest`（默认）/ `priceAsc` / `priceDesc` / `views` |

### GET /products/:id 返回字段

| 字段 | 说明 |
|---|---|
| id / sellerId / categoryId | 主键、卖家 ID、分类 ID |
| sellerNickname / sellerAvatar | 卖家昵称、头像 |
| categoryName | 分类名 |
| title / description | 标题、描述 |
| price / originalPrice | 现价、原价（无原价为 null） |
| conditionLevel | 成色 1 全新 / 2 几乎全新 / 3 轻微使用 / 4 明显使用 |
| status | 1 待审核 / 2 在售 / 3 已售出 / 4 已下架 / 5 驳回 |
| viewCount / location / contact | 浏览量、交易地点、联系方式 |
| images | 图片 URL 数组，来自 `product_image` 表，按 `sort` 升序 |
| favorited | 当前登录用户是否已收藏；未登录为 `false` |

### 发布商品 POST /products

请求体（`categoryId / title / price / conditionLevel` 必填，其余选填）：

```json
{
  "categoryId": 3,
  "title": "九成新高等数学教材",
  "description": "大一教材，无笔记，封面轻微磨损",
  "price": 35.0,
  "originalPrice": 60.0,
  "conditionLevel": 2,
  "location": "东校区宿舍楼下",
  "contact": "微信 wxid_demo",
  "images": ["/uploads/xxx.jpg", "/uploads/yyy.jpg"]
}
```

- 新商品 `status = 1`（待审核），审核通过后才进入在售列表；
- 标题长度 2-30 字，价格须大于 0，图片最多 3 张；
- 商品与图片在同一事务内写入。

返回：

```json
{ "code": 0, "message": "发布成功，等待审核", "data": { "id": 12, "status": 1 } }
```

### 账户与我的发布

#### POST /auth/register

请求体：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| username | string | 是 | 3-20 位字母、数字或下划线，唯一 |
| password | string | 是 | 不少于 6 位，bcrypt 哈希存储 |
| nickname | string | 否 | 昵称，默认同账号 |

注册成功返回 `{ token, expiresIn, user }`，`role` 默认 `1`（学生）；用户名重复返回 `40901`。

#### GET /auth/me

需登录，返回当前用户安全信息（不含密码哈希）：`id / username / nickname / avatar / phone / school / college / gender / role / status`。

#### GET /users/me/products

我的发布，Query：`status`（商品状态）、`page`、`pageSize`。返回 `{ list, total, page, pageSize }`，list 为当前卖家发布的全部状态商品（含待审核、在售、已售出、已下架、驳回）。

#### PATCH /products/:id/offline

卖家本人下架；待审核 / 在售 / 驳回可下架，已售出不可操作（`40901`），非本人返回 `40301`。返回 `{ id, status: 4 }`。

#### DELETE /products/:id

软删除（置 `deletedAt`），卖家本人或管理员可操作，非本人返回 `40301`。

### 图片上传 POST /upload

- `multipart/form-data`，字段名 `file`，单张图片；
- 仅支持 JPG / PNG / WebP / GIF，单张 ≤ 5MB；
- 文件保存到 `public/uploads/`，通过 `/uploads/<文件名>` 静态访问。

返回：

```json
{ "code": 0, "message": "success", "data": { "url": "/uploads/1731650000-ab12cd.jpg", "filename": "1731650000-ab12cd.jpg", "size": 102400 } }
```

### 收藏接口

**POST /favorites** —— 请求体：

```json
{ "productId": 1 }
```

返回：

```json
{ "code": 0, "message": "收藏成功", "data": { "productId": 1, "favorited": true } }
```

**GET /favorites?page=1&pageSize=10** —— 返回分页结构：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      { "id": 1, "createdAt": "2026-11-15T10:00:00.000Z", "product": { "id": 1, "title": "……" } }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10
  }
}
```

**DELETE /favorites/:productId** —— 返回：

```json
{ "code": 0, "message": "已取消收藏", "data": { "productId": 1, "favorited": false } }
```

### 订单接口（/orders）

**订单状态枚举**：`1` 待确认 / `2` 待付款 / `3` 待交付 / `4` 待收货 / `5` 已完成 / `6` 已取消 / `7` 退款申诉中。

#### POST /orders

请求体：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| productId | number | 是 | 成交商品 ID |
| quantity | number | 否 | 数量，默认 1（闲置单件通常为 1） |
| tradeLocation | string | 否 | 约定交易地点，默认取商品地点 |
| remark | string | 否 | 买家备注 |
| paymentMethod | number | 否 | 支付方式，默认 1 当面交易 |

服务端事务内校验：商品存在且在售、非本人商品、无其他进行中订单（状态 1/2/3/4）；写入订单并快照商品标题、首图、单价。返回订单对象。

#### GET /orders

Query：`role=buyer|seller`（默认买家）、`status`、`keyword`（订单号）、`page`、`pageSize`。返回 `{ list, total, page, pageSize }`。

#### GET /orders/:id

仅买家、卖家或管理员可查看，否则 `40301`。

#### 状态流转 PATCH /orders/:id/:action

| action | 角色 | 前置状态 | 目标状态 |
|---|---|---|---|
| confirm | 卖家 | 1 待确认 | 2 待付款 |
| pay | 买家 | 2 待付款 | 3 待交付 |
| deliver | 卖家 | 3 待交付 | 4 待收货 |
| complete | 买家 | 4 待收货 | 5 已完成（商品置已售出） |
| cancel | 买家 / 卖家 | 1/2/3 | 6 已取消，可带 `cancelReason` |
| refund | 买家 | 3/4 | 7 退款申诉中，可带 `cancelReason` |

非法角色或非法状态流转返回 `40301` / `40901`。

### 管理端接口（/admin）

> 权限隔离：两条路由均叠加 `authRequired` + `adminRequired`。未登录返回 `40101`；已登录但 `role !== 2`（普通学生）返回 `40301`，不会触达数据库。

#### GET /admin/products

后台商品分页列表，查询参数：

| 参数 | 说明 |
|---|---|
| page | 页码，默认 1 |
| pageSize | 每页条数，默认 10，最大 50 |
| status | 商品状态筛选：1 待审核 / 2 在售 / 3 已售出 / 4 已下架 / 5 驳回 |
| categoryId | 分类 ID 筛选 |
| keyword | 标题 / 描述关键词 |

分页由 Prisma `skip` + `take` 实现，`findMany` 与 `count` 并发查询，不全量返回。返回结构：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 12,
        "title": "九成新高等数学教材",
        "categoryName": "教材书籍",
        "sellerNickname": "张三",
        "price": 35.0,
        "status": 1,
        "auditRemark": null,
        "images": ["/uploads/xxx.jpg"],
        "createdAt": "2026-11-15T10:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10
  }
}
```

#### PUT /admin/products/:id/audit

审核操作。请求体中 `status` 为**动作码**（区别于商品状态码）：

| 请求 status | 含义 | 后端写入商品 status |
|---|---|---|
| 1 | 通过 | 2 在售，清空驳回原因 |
| 2 | 驳回 | 5 审核驳回，记录 `auditRemark` |

请求体：

```json
{ "status": 2, "remark": "图片模糊，无法看清商品成色" }
```

- `remark` 选填；驳回未填时默认「不符合发布规范」。

返回：

```json
{ "code": 0, "message": "审核完成", "data": { "id": 12, "status": 5, "auditRemark": "图片模糊……" } }
```

#### GET /admin/orders

后台全量订单分页列表，Query：`status`、`keyword`（订单号 / 商品标题）、`page`、`pageSize`。返回 `{ list, total, page, pageSize }`，list 元素含买卖双方昵称与商品快照信息。

## 接口测试方法

### 方式一：curl（命令行）

前置：已完成「初始化数据库与启动」，服务跑在 `http://localhost:3000`。

```bash
# 0. 基础地址
BASE=http://localhost:3000/api/v1

# 1. 登录，拿到 token（种子管理员 admin / admin123）
curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 从返回 JSON 的 data.token 复制 token，或装了 jq 后自动提取：
# TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
#   -d '{"username":"admin","password":"admin123"}' | jq -r '.data.token')

# 1b. 学生注册（返回 token + user）
curl -s -X POST $BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"student01","password":"123456","nickname":"新生"}'

# 1c. 当前登录用户信息
curl -s $BASE/auth/me -H "Authorization: Bearer $TOKEN"

# 1d. 我的发布（可按状态筛选）
curl -s "$BASE/users/me/products?status=2&page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN"

# 1e. 下架 / 删除我的商品
curl -s -X PATCH $BASE/products/12/offline -H "Authorization: Bearer $TOKEN"
curl -s -X DELETE $BASE/products/12 -H "Authorization: Bearer $TOKEN"

# 2. 商品详情（不带 Token：favorited 恒为 false）
curl -s $BASE/products/1

# 2b. 商品详情（带 Token：favorited 反映当前用户收藏态）
curl -s $BASE/products/1 -H "Authorization: Bearer $TOKEN"

# 2c. 上传图片（multipart，字段名 file），返回 data.url
curl -s -X POST $BASE/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/photo.jpg"

# 2d. 发布商品（images 取上一步返回的 url；新商品默认待审核）
curl -s -X POST $BASE/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"categoryId":3,"title":"九成新高数教材","price":35,"conditionLevel":2,"images":["/uploads/xxx.jpg"]}'

# 3. 添加收藏
curl -s -X POST $BASE/favorites \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":1}'

# 4. 收藏列表（分页）
curl -s "$BASE/favorites?page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN"

# 5. 取消收藏
curl -s -X DELETE $BASE/favorites/1 \
  -H "Authorization: Bearer $TOKEN"

# 6. 未登录访问受保护接口（期望 40101）
curl -s $BASE/favorites

# 7. 后台商品审核列表（需管理员 Token；学生角色返回 40301）
curl -s "$BASE/admin/products?status=1&page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN"

# 7b. 审核通过（动作码 1 → 商品在售）
curl -s -X PUT $BASE/admin/products/12/audit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":1}'

# 7c. 驳回（动作码 2 → 商品驳回，附原因）
curl -s -X PUT $BASE/admin/products/12/audit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":2,"remark":"图片模糊，无法看清成色"}'

# 8. 下单（productId 取在售商品）
curl -s -X POST $BASE/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"tradeLocation":"西区宿舍7号楼","remark":"下午6点后可面交"}'

# 8b. 我的订单（买入 / 卖出）
curl -s "$BASE/orders?role=buyer&page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN"

# 8c. 订单状态流转：卖家接单 / 买家付款 / 卖家发货 / 买家确认收货
curl -s -X PATCH $BASE/orders/3001/confirm -H "Authorization: Bearer $TOKEN"
curl -s -X PATCH $BASE/orders/3001/pay -H "Authorization: Bearer $TOKEN"
curl -s -X PATCH $BASE/orders/3001/deliver -H "Authorization: Bearer $TOKEN"
curl -s -X PATCH $BASE/orders/3001/complete -H "Authorization: Bearer $TOKEN"

# 9. 后台订单管理（需管理员 Token）
curl -s "$BASE/admin/orders?status=1&page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN"
```

常见返回码：`40001` 参数错误、`40101` 未登录、`40401` 商品不存在、`40901` 商品状态冲突（非在售不可收藏）。

### 方式二：Postman

1. **新建 Collection**：命名「校园交易平台后端」。在 Collection 的 *Variables* 里配置：
   - `baseUrl` = `http://localhost:3000/api/v1`
   - `token` = （留空，登录后自动写入）
2. **登录请求**：`POST {{baseUrl}}/auth/login`，Body → raw → JSON：
   ```json
   { "username": "admin", "password": "admin123" }
   ```
   在该请求的 *Tests* 标签页写入，登录成功后自动保存 token：
   ```js
   const res = pm.response.json()
   if (res.code === 0) pm.collectionVariables.set('token', res.data.token)
   ```
3. **受保护请求统一鉴权**：在 Collection 级 *Headers* 添加 `Authorization: Bearer {{token}}`，子请求自动继承。
4. **逐个新增请求**：

   | 请求 | 方法 | URL | Body / 参数 |
   |---|---|---|---|
   | 商品详情 | GET | `{{baseUrl}}/products/1` | 无（可对比带/不带鉴权头） |
   | 图片上传 | POST | `{{baseUrl}}/upload` | form-data，字段 `file` 选图片 |
   | 发布商品 | POST | `{{baseUrl}}/products` | raw JSON，字段见「发布商品」小节 |
   | 添加收藏 | POST | `{{baseUrl}}/favorites` | raw JSON `{"productId":1}` |
   | 收藏列表 | GET | `{{baseUrl}}/favorites` | Query：`page=1`、`pageSize=10` |
   | 取消收藏 | DELETE | `{{baseUrl}}/favorites/1` | 无 |

5. 发送后在 *Body* 查看 `{ code, message, data }`；`code=0` 即成功。

## 响应格式

```json
{ "code": 0, "message": "success", "data": {} }
```

- `code = 0` 成功；非 0 为业务错误码（40001 参数错误 / 40101 未登录 / 40301 无权限 / 40401 不存在 / 40901 状态冲突 / 50001 服务器错误）。
- 分页返回：`{ list, total, page, pageSize }`。

## 鉴权约定

受保护接口在请求头携带：`Authorization: Bearer <token>`。
JWT 载荷：`{ userId, role, username }`，`role` 1=学生、2=管理员。
详情接口使用可选鉴权（`optionalAuth`）：带 Token 才计算 `favorited`，未带则放行并返回 `favorited: false`。

## 后续待接入（P2 优化）

- 图片对象存储（OSS / COS）替换本地上传
- 统一参数校验层（如 zod / express-validator）
- 单元 / 接口测试、真实 MySQL 全链路联调
- 前端构建分包、按需引入 Element Plus；JWT 刷新与接口限流加固
