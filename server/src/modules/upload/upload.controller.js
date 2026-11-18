import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { success, fail } from '../../utils/response.js'

// 本地存储目录：server/public/uploads
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
    cb(null, name)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('仅支持 JPG / PNG / WebP / GIF 格式图片'))
    }
  }
})

/**
 * POST /api/v1/upload
 * 单图上传，表单字段名 file；返回可访问的相对 URL
 */
export function uploadImage(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return fail(res, { code: 40001, message: err.message || '图片上传失败', httpStatus: 400 })
    }
    if (!req.file) {
      return fail(res, { code: 40001, message: '请选择图片', httpStatus: 400 })
    }
    const url = `/uploads/${req.file.filename}`
    success(res, { url, filename: req.file.filename, size: req.file.size })
  })
}
