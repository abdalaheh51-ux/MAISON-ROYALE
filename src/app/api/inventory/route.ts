import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { ComponentCategory, ComponentOption } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET /api/inventory — ERP view: every component with stock (incl. sold-out)
// plus aggregate stats for the dashboard.
export async function GET() {
  const components = await db.component.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    include: { watchModel: { select: { name: true, slug: true } } },
  })

  const items: Array<ComponentOption & { watchName: string }> = components.map((c) => ({
    id: c.id,
    category: c.category as ComponentCategory,
    name: c.name,
    config: JSON.parse(c.config),
    priceDelta: c.priceDelta,
    stock: c.stock,
    lowStockAt: c.lowStockAt,
    watchName: c.watchModel.name,
  }))

  const totalUnits = items.reduce((s, i) => s + i.stock, 0)
  const lowStock = items.filter((i) => i.stock > 0 && i.stock <= i.lowStockAt).length
  const soldOut = items.filter((i) => i.stock === 0).length
  const inventoryValueCents = items.reduce((s, i) => s + i.stock * i.priceDelta, 0)

  return NextResponse.json(
    {
      items,
      stats: { totalUnits, lowStock, soldOut, inventoryValueCents, skuCount: items.length },
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

// PATCH /api/inventory — restock / adjust a single component's stock.
// Body: { id: string, delta: number }  (delta may be negative to consume)
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body.id !== 'string' || typeof body.delta !== 'number') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const current = await db.component.findUnique({ where: { id: body.id } })
  if (!current) {
    return NextResponse.json({ error: 'Component not found' }, { status: 404 })
  }

  const next = Math.max(0, current.stock + Math.trunc(body.delta))

  const updated = await db.component.update({
    where: { id: body.id },
    data: { stock: next },
  })

  return NextResponse.json({
    id: updated.id,
    stock: updated.stock,
    lowStockAt: updated.lowStockAt,
    isLow: updated.stock > 0 && updated.stock <= updated.lowStockAt,
    isSoldOut: updated.stock === 0,
  })
}
