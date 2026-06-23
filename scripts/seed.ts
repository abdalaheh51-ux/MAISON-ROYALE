// Seed luxury watch data: 1 model + full component catalog with stock levels
// (includes sold-out and low-stock items to exercise the ERP mini-system).
import { db } from '../src/lib/db'

async function main() {
  // Wipe
  await db.orderItem.deleteMany()
  await db.order.deleteMany()
  await db.component.deleteMany()
  await db.watchModel.deleteMany()

  const model = await db.watchModel.create({
    data: {
      slug: 'chronograph-royale',
      name: 'Chronograph Royale',
      tagline: 'Where precision meets legacy.',
      description:
        'An assertion of horological excellence. The Chronograph Royale unites a hand-finished movement with an architecture of light and shadow. Every component is selected, assembled and regulated by a single master watchmaker — then yours to compose.',
      basePrice: 420000, // $4,200.00
      heroImage: '/images/hero.png',
    },
  })

  const components: Array<{
    category: string
    name: string
    config: Record<string, string>
    priceDelta: number
    stock: number
    lowStockAt: number
  }> = [
    // ───────────── DIALS ─────────────
    { category: 'dial', name: 'Midnight Blue', config: { color: '#0a1a3f', finish: 'sunburst', accent: '#c9a96e' }, priceDelta: 0, stock: 12, lowStockAt: 5 },
    { category: 'dial', name: 'Obsidian Black', config: { color: '#0a0a0a', finish: 'matte', accent: '#b8b8b8' }, priceDelta: 0, stock: 8, lowStockAt: 5 },
    { category: 'dial', name: 'Emerald Green', config: { color: '#0f3d2e', finish: 'guilloche', accent: '#c9a96e' }, priceDelta: 35000, stock: 3, lowStockAt: 5 },
    { category: 'dial', name: 'Champagne Ivory', config: { color: '#e8dcc0', finish: 'sunburst', accent: '#8b6f3a' }, priceDelta: 25000, stock: 0, lowStockAt: 5 },
    { category: 'dial', name: 'Burgundy', config: { color: '#3d0a14', finish: 'sunburst', accent: '#c9a96e' }, priceDelta: 30000, stock: 6, lowStockAt: 5 },

    // ───────────── STRAPS ─────────────
    { category: 'strap', name: 'Black Alligator Leather', config: { type: 'leather', color: '#1a1a1a', stitch: '#c9a96e' }, priceDelta: 0, stock: 15, lowStockAt: 5 },
    { category: 'strap', name: 'Brown Calfskin Leather', config: { type: 'leather', color: '#5a3825', stitch: '#d4b896' }, priceDelta: 0, stock: 9, lowStockAt: 5 },
    { category: 'strap', name: 'Steel Bracelet', config: { type: 'metal', color: '#c0c0c8', stitch: '#000000' }, priceDelta: 80000, stock: 4, lowStockAt: 5 },
    { category: 'strap', name: 'Rose Gold Bracelet', config: { type: 'metal', color: '#d4a574', stitch: '#000000' }, priceDelta: 180000, stock: 2, lowStockAt: 5 },
    { category: 'strap', name: 'Racing Rubber', config: { type: 'rubber', color: '#1a1a1a', stitch: '#ff3333' }, priceDelta: 15000, stock: 0, lowStockAt: 5 },

    // ───────────── HANDS ─────────────
    { category: 'hands', name: 'Dauphine Gold', config: { style: 'dauphine', color: '#c9a96e' }, priceDelta: 0, stock: 20, lowStockAt: 5 },
    { category: 'hands', name: 'Sword Steel', config: { style: 'sword', color: '#e0e0e0' }, priceDelta: 0, stock: 14, lowStockAt: 5 },
    { category: 'hands', name: 'Baton Lume', config: { style: 'baton', color: '#e8e8e8' }, priceDelta: 8000, stock: 7, lowStockAt: 5 },
    { category: 'hands', name: 'Leaf Rose Gold', config: { style: 'leaf', color: '#d4a574' }, priceDelta: 12000, stock: 0, lowStockAt: 5 },

    // ───────────── CASE ─────────────
    { category: 'case', name: 'Brushed Steel', config: { material: 'steel', color: '#b8b8c0' }, priceDelta: 0, stock: 18, lowStockAt: 5 },
    { category: 'case', name: 'Polished Gold', config: { material: 'gold', color: '#d4af37' }, priceDelta: 120000, stock: 5, lowStockAt: 5 },
    { category: 'case', name: 'Rose Gold', config: { material: 'rose-gold', color: '#d4a574' }, priceDelta: 150000, stock: 3, lowStockAt: 5 },
    { category: 'case', name: 'Black DLC Steel', config: { material: 'black-steel', color: '#1a1a1a' }, priceDelta: 60000, stock: 6, lowStockAt: 5 },
  ]

  for (const c of components) {
    await db.component.create({
      data: {
        category: c.category,
        name: c.name,
        config: JSON.stringify(c.config),
        priceDelta: c.priceDelta,
        stock: c.stock,
        lowStockAt: c.lowStockAt,
        watchModelId: model.id,
      },
    })
  }

  console.log(`Seeded watch model "${model.name}" with ${components.length} components.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
