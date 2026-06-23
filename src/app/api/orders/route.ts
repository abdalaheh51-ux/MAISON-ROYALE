import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { OrderPayload, OrderResult } from '@/lib/types'

export const dynamic = 'force-dynamic'

// POST /api/orders — confirm a configuration as an order.
// Atomically decrements the stock of each chosen component inside a tx; if any
// selected component is sold out the order is rejected (ERP integrity).
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as OrderPayload | null
  if (
    !body ||
    !body.watchModelId ||
    !body.componentIds?.dial ||
    !body.componentIds?.strap ||
    !body.componentIds?.hands ||
    !body.componentIds?.case
  ) {
    return NextResponse.json({ error: 'Incomplete configuration' }, { status: 400 })
  }

  const ids = [
    body.componentIds.dial,
    body.componentIds.strap,
    body.componentIds.hands,
    body.componentIds.case,
  ]

  try {
    const result = await db.$transaction(async (tx) => {
      const model = await tx.watchModel.findUnique({ where: { id: body.watchModelId } })
      if (!model) throw new Error('Watch model not found')

      const components = await tx.component.findMany({ where: { id: { in: ids } } })
      if (components.length !== 4) throw new Error('One or more components are invalid')

      for (const c of components) {
        if (c.stock <= 0) {
          throw new Error(`"${c.name}" is sold out`)
        }
      }

      for (const c of components) {
        await tx.component.update({
          where: { id: c.id },
          data: { stock: c.stock - 1 },
        })
      }

      const totalCents =
        model.basePrice + components.reduce((s, c) => s + c.priceDelta, 0)

      const reference =
        'LWC-' + Math.random().toString(36).slice(2, 7).toUpperCase()

      const order = await tx.order.create({
        data: {
          reference,
          watchModelId: model.id,
          customerName: body.customerName || null,
          totalCents,
          status: 'confirmed',
          items: {
            create: components.map((c) => ({
              componentId: c.id,
              category: c.category,
              name: c.name,
              priceDelta: c.priceDelta,
            })),
          },
        },
      })

      const orderResult: OrderResult = {
        reference: order.reference,
        totalCents: order.totalCents,
        status: order.status,
      }
      return orderResult
    })

    return NextResponse.json(result, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Order failed'
    return NextResponse.json({ error: message }, { status: 409 })
  }
}
