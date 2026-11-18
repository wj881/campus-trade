import prisma from '../../prisma/client.js'
import { success } from '../../utils/response.js'

/** GET /api/v1/categories?status=1 */
export async function list(req, res, next) {
  try {
    const status = req.query.status ? Number(req.query.status) : undefined
    const where = status ? { status } : {}

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }]
    })

    success(
      res,
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        parentId: c.parentId,
        icon: c.icon,
        sort: c.sort,
        status: c.status
      }))
    )
  } catch (err) {
    next(err)
  }
}
