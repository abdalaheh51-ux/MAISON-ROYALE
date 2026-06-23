import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { CatalogDTO, ComponentCategory, ComponentOption } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET /api/catalog — returns the watch model plus all components grouped by
// category. Sold-out components (stock === 0) are returned but flagged; the
// client hides them from the configurator so options disappear live.
export async function GET() {
  const model = await db.watchModel.findFirst({
    orderBy: { createdAt: 'asc' },
  })
  if (!model) {
    return NextResponse.json({ error: 'No watch model configured' }, { status: 404 })
  }

  const components = await db.component.findMany({
    where: { watchModelId: model.id },
    orderBy: [{ category: 'asc' }, { priceDelta: 'asc' }],
  })

  const grouped: Record<ComponentCategory, ComponentOption[]> = {
    dial: [],
    strap: [],
    hands: [],
    case: [],
  }

  for (const c of components) {
    grouped[c.category as ComponentCategory].push({
      id: c.id,
      category: c.category as ComponentCategory,
      name: c.name,
      config: JSON.parse(c.config),
      priceDelta: c.priceDelta,
      stock: c.stock,
      lowStockAt: c.lowStockAt,
    })
  }

  const dto: CatalogDTO = {
    model: {
      id: model.id,
      slug: model.slug,
      name: model.name,
      tagline: model.tagline,
      description: model.description,
      basePrice: model.basePrice,
      heroImage: model.heroImage,
    },
    components: grouped,
  }

  return NextResponse.json(dto, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
