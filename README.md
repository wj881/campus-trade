# 校园闲置交易平台

面向校园场景的闲置物品交易平台，由三个可独立运行的服务组成：**C 端（学生端）**、**B 端（管理后台）**、**后端 API**。

- **C 端**：注册登录、浏览搜索商品、商品详情、收藏、发布闲置、我的发布（下架 / 删除）、下单、我的订单、个人中心
- **B 端**：商品审核、商品管理、订单管理、分类管理、用户管理
- **后端**：RESTful API、JWT 鉴权、角色权限（学生 / 管理员）、图片上传、Prisma 数据访问

## 技术栈

| 模块 | 技术 |
|---|---|
| 后端 | Node.js + Express 4.19 + Prisma 5.x + MySQL 8 + JWT + bcryptjs + multer |
| C 端 | Vue 3.4 + Vite 5 + Vant 4 + Pinia + Vue Router 4 + Axios |
| B 端 | Vue 3.4 + Vite 5 + Element Plus 2.8 + Pinia + Vue Router 4 + Axios |

## 目录结构

```
校园交易平台/
├── server/                     # 后端 API
│   ├── prisma/
│   │   ├── schema.prisma       # 数据模型
│   │   └── seed.js             # 种子数据（管理员 + 默认分类）
│   ├── public/uploads/         # 本地上传的图片
│   ├── src/
│   │   ├── config/             # 配置（数据库、JWT）
│   │   ├── middleware/         # 鉴权、错误处理
│   │   ├── modules/            # 业务模块
│   │   │   ├── auth/           # 注册登录
│   │   │   ├── category/       # 分类
│   │   │   ├── product/        # 商品
│   │   │   ├── favorite/       # 收藏
│   │   │   ├── order/          # 订单
│   │   │   ├── upload/         # 图片上传
│   │   │   └── admin/          # 后台管理
│   │   ├── routes/             # 路由注册
│   │   └── utils/              # 响应封装等
│   ├── .env.example            # 环境变量模板
│   └── package.json
├── web-customer/               # C 端（学生端）
│   └── src/views/              # login / register / product / order / favorites / my-products / profile
└── web-admin/                  # B 端（管理后台）
    └── src/views/              # login / audit / product / order / category / user
```

## 快速开始

### 前置要求

- Node.js **≥ 18**
- MySQL **8.x**（本地已启动）
- 无需额外安装数据库客户端，Prisma 会自动建表

### 1. 创建数据库

用 MySQL 客户端（命令行或 Navicat 均可）执行：

```sql
CREATE DATABASE IF NOT EXISTS campus_trade
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
```

### 2. 启动后端

```powershell
cd server
copy .env.example .env
```

打开 `server/.env`，把 `DATABASE_URL` 里的**用户名和密码改成你本机 MySQL 的实际值**：

```
DATABASE_URL="mysql://root:你的密码@localhost:3306/campus_trade"
```

> `.env` 已被 `.gitignore` 排除，不会提交到仓库，请勿把真实密码写进代码或文档。

然后依次执行：

```powershell
npm install
npx prisma generate      # 生成 Prisma Client
npx prisma db push       # 按 schema 建表
npm run seed             # 写入管理员账号 + 8 个默认分类
npm run dev              # 启动服务
```

看到 `running on http://localhost:3000/api/v1` 即成功。

### 3. 启动 C 端（学生端）

```powershell
cd web-customer
npm install
npm run dev
```

访问 http://localhost:5173

### 4. 启动 B 端（管理后台）

```powershell
cd web-admin
npm install
npm run dev
```

访问 http://localhost:5174

> 前端已配置 Vite 代理，`/api` 和 `/uploads` 自动转发到 `http://localhost:3000`，无需处理跨域。

## 端口与服务

| 服务 | 端口 | 地址 |
|---|---|---|
| 后端 API | 3000 | http://localhost:3000/api/v1 |
| C 端 | 5173 | http://localhost:5173 |
| B 端 | 5174 | http://localhost:5174 |

启动顺序建议：**先后端，再两个前端**（前端页面需要后端数据）。

## 默认账号

| 角色 | 账号 | 密码 | 说明 |
|---|---|---|---|
| 管理员 | `admin` | `admin123` | 通过 B 端登录，拥有全部后台权限 |

学生账号不预置，请在 C 端「注册」页自行注册；注册后默认角色为学生（`role=1`）。

## 环境变量

`server/.env`：

| 变量 | 说明 | 示例 |
|---|---|---|
| `PORT` | 服务端口 | `3000` |
| `DATABASE_URL` | MySQL 连接串 | `mysql://root:密码@localhost:3306/campus_trade` |
| `JWT_SECRET` | Token 签名密钥，生产环境必须替换 | `change_me_to_a_long_random_secret` |
| `JWT_EXPIRES_IN` | Token 有效期 | `2h` |

`web-customer/.env.development` 与 `web-admin/.env.development`：

| 变量 | 说明 | 值 |
|---|---|---|
| `VITE_API_BASE_URL` | 接口前缀（走 Vite 代理） | `/api/v1` |

## 接口约定

- 统一前缀：`/api/v1`
- 响应外壳：`{ "code": 0, "message": "success", "data": ... }`，`code=0` 表示成功
- 鉴权方式：请求头 `Authorization: Bearer <token>`

| 错误码 | 含义 |
|---|---|
| 40001 | 参数错误 |
| 40101 | 未登录 / Token 失效 |
| 40301 | 无权限 |
| 40401 | 资源不存在 |
| 40901 | 状态冲突 |
| 50001 | 服务端错误 |

## 枚举约定

**商品状态**：`1 待审核` / `2 在售` / `3 已售出` / `4 已下架` / `5 审核驳回`

**成色**：`1 全新` / `2 几乎全新` / `3 轻微使用` / `4 明显使用`

**订单状态**：`1 待确认` / `2 待付款` / `3 待交付` / `4 待收货` / `5 已完成` / `6 已取消` / `7 退款申诉中`

**用户角色**：`1 学生` / `2 管理员`；**用户状态**：`1 正常` / `0 封禁`

## 常见问题

**`P1012 Environment variable not found: DATABASE_URL`**
`server/.env` 不存在。执行 `copy .env.example .env` 并填好数据库信息。

**`Authentication failed ... credentials for root are not valid`**
`.env` 里的密码与本机 MySQL 不一致。改成实际密码后，**重启后端**（前端不用重启）。

**`Unknown field 'xxx' for include statement on model 'Product'`**
Prisma `include` 里的关系字段名与 `schema.prisma` 不一致。商品图片关系字段是 `images`，不是 `productImage`。

**3000 端口被占用**
先关掉旧的后端进程（`Ctrl+C` 或结束占用的 PID），再重新 `npm run dev`。

**浏览器直接访问 `localhost:3000/api/v1` 返回 40401**
正常现象。根路径没有路由，实际接口是 `POST /api/v1/auth/login` 等具体路径。

**图片不显示**
确认后端 `public/uploads` 存在、`/uploads` 代理已配置，且图片是由后端上传接口写入的。

## 已知限制 / 后续优化

- 图片为本地上传 + 静态目录托管，生产环境建议替换为对象存储（OSS / COS）
- B 端 Element Plus 全量引入，主 chunk 偏大，可按需引入或 `manualChunks` 拆分
- 参数校验分散在各 service，可抽取统一校验层
- 尚无单元测试 / 接口测试，真实 MySQL 全链路联调待补
- JWT 暂不支持刷新，未做接口限流
- 接口设计中有但尚未实现：`POST /auth/logout`、`PUT /users/me/profile`
