import express from 'express'
import cors from 'cors'
import path from 'node:path'
import routes from './routes/index.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(cors())
app.use(express.json())

// 本地上传图片静态访问
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')))

// 业务路由统一挂在 /api/v1 下
app.use('/api/v1', routes)

// 404 与全局错误处理
app.use(notFound)
app.use(errorHandler)

export default app
