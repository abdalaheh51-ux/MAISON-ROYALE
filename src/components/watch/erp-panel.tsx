'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Boxes,
  Minus,
  PackageX,
  Plus,
  RefreshCw,
  TriangleAlert,
  Layers,
  DollarSign,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatUSD } from '@/lib/format'
import type { ComponentCategory, ComponentOption } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type InventoryItem = ComponentOption & { watchName: string }
interface InventoryData {
  items: InventoryItem[]
  stats: {
    totalUnits: number
    lowStock: number
    soldOut: number
    inventoryValueCents: number
    skuCount: number
  }
}

const CATEGORY_LABEL: Record<ComponentCategory, string> = {
  dial: 'Dial',
  strap: 'Strap',
  hands: 'Hands',
  case: 'Case',
}

export function ErpPanel({ onInventoryChanged }: { onInventoryChanged?: () => void }) {
  const [data, setData] = useState<InventoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory', { cache: 'no-store' })
      const json = (await res.json()) as InventoryData
      setData(json)
    } catch {
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function adjust(id: string, delta: number, name: string) {
    setBusyId(id)
    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, delta }),
      })
      if (!res.ok) throw new Error('Adjustment failed')
      const updated = await res.json()
      setData((d) => {
        if (!d) return d
        return {
          ...d,
          items: d.items.map((it) =>
            it.id === id
              ? { ...it, stock: updated.stock, lowStockAt: updated.lowStockAt }
              : it,
          ),
          stats: {
            ...d.stats,
            totalUnits: d.stats.totalUnits + delta,
            lowStock:
              d.items.filter((it) => it.id === id)[0]?.stock > updated.stock
                ? d.stats.lowStock
                : d.stats.lowStock, // recompute below
            soldOut: 0, // recompute below
            inventoryValueCents: d.stats.inventoryValueCents + delta * (d.items.find((it) => it.id === id)?.priceDelta ?? 0),
            skuCount: d.stats.skuCount,
          },
        }
      })
      // Recompute stats cleanly from the items list:
      setData((d) => {
        if (!d) return d
        const lowStock = d.items.filter((i) => i.stock > 0 && i.stock <= i.lowStockAt).length
        const soldOut = d.items.filter((i) => i.stock === 0).length
        return { ...d, stats: { ...d.stats, lowStock, soldOut } }
      })
      onInventoryChanged?.()
      toast.success(
        delta > 0 ? `Restocked ${name} (+${delta})` : `Consumed ${name} (${delta})`,
      )
    } catch {
      toast.error('Could not adjust stock')
    } finally {
      setBusyId(null)
    }
  }

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading inventory…
      </div>
    )
  }

  const { stats } = data
  const sorted = [...data.items].sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
  )

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi
          icon={<Boxes className="h-4 w-4" />}
          label="Total units"
          value={stats.totalUnits.toString()}
          tone="default"
        />
        <Kpi
          icon={<Layers className="h-4 w-4" />}
          label="Active SKUs"
          value={stats.skuCount.toString()}
          tone="default"
        />
        <Kpi
          icon={<TriangleAlert className="h-4 w-4" />}
          label="Low stock"
          value={stats.lowStock.toString()}
          tone="warn"
        />
        <Kpi
          icon={<PackageX className="h-4 w-4" />}
          label="Sold out"
          value={stats.soldOut.toString()}
          tone="danger"
        />
      </div>

      {/* inventory table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card/40">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h4 className="font-serif text-lg text-foreground">Component inventory</h4>
            <p className="text-xs text-muted-foreground">
              Live stock ledger · adjusting here re-opens options in the configurator
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={load} className="text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="max-h-[28rem] overflow-y-auto luxe-scroll">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card/95 backdrop-blur">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Component</th>
                <th className="px-3 py-2.5 font-medium">Category</th>
                <th className="px-3 py-2.5 text-right font-medium">Stock</th>
                <th className="px-3 py-2.5 text-right font-medium">Adj. cost</th>
                <th className="px-4 py-2.5 text-right font-medium">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((it) => {
                const isSoldOut = it.stock === 0
                const isLow = it.stock > 0 && it.stock <= it.lowStockAt
                return (
                  <tr
                    key={it.id}
                    className={cn(
                      'border-t border-border/60 transition-colors hover:bg-secondary/30',
                      isSoldOut && 'bg-red-950/20',
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full border border-white/20"
                          style={{
                            background:
                              it.category === 'dial' || it.category === 'case'
                                ? (it.config as { color: string }).color
                                : it.category === 'strap'
                                  ? (it.config as { color: string }).color
                                  : (it.config as { color: string }).color,
                          }}
                        />
                        <span className="font-serif text-foreground">{it.name}</span>
                        {isSoldOut && (
                          <Badge variant="outline" className="border-red-500/40 text-red-400">
                            <PackageX className="mr-1 h-3 w-3" /> Sold out
                          </Badge>
                        )}
                        {isLow && (
                          <Badge variant="outline" className="border-amber-500/40 text-amber-300">
                            <TriangleAlert className="mr-1 h-3 w-3" /> Low
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {CATEGORY_LABEL[it.category]}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <motion.span
                        key={it.stock}
                        initial={{ scale: 1.3, color: '#facc15' }}
                        animate={{ scale: 1, color: 'var(--foreground)' }}
                        transition={{ duration: 0.4 }}
                        className="inline-block font-mono font-semibold"
                      >
                        {it.stock}
                      </motion.span>
                      <span className="ml-1 text-xs text-muted-foreground">/ {it.lowStockAt}⌄</span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">
                      {it.priceDelta === 0 ? '—' : `+${formatUSD(it.priceDelta)}`}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 border-border"
                          disabled={it.stock === 0 || busyId === it.id}
                          onClick={() => adjust(it.id, -1, it.name)}
                          aria-label={`Consume one ${it.name}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 border-border px-2 text-xs"
                          disabled={busyId === it.id}
                          onClick={() => adjust(it.id, 5, it.name)}
                        >
                          +5
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 border-border bg-primary/10 text-primary hover:bg-primary/20"
                          disabled={busyId === it.id}
                          onClick={() => adjust(it.id, 1, it.name)}
                          aria-label={`Restock one ${it.name}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border bg-background/40 px-4 py-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" /> Component inventory value
          </span>
          <span className="font-mono text-foreground">
            {formatUSD(stats.inventoryValueCents)}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/20 p-3 text-xs text-muted-foreground">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
        <p>
          ERP integrity: when a component reaches <strong className="text-foreground">0 stock</strong>,
          it is automatically removed from the configurator options. Restocking it here re-opens it
          live. New orders are atomic — they decrement all four chosen components inside a single
          transaction.
        </p>
      </div>
    </div>
  )
}

function Kpi({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone: 'default' | 'warn' | 'danger'
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card/40 p-4',
        tone === 'warn' && 'border-amber-500/30',
        tone === 'danger' && 'border-red-500/30',
        tone === 'default' && 'border-border',
      )}
    >
      <div
        className={cn(
          'mb-2 flex h-8 w-8 items-center justify-center rounded-lg',
          tone === 'default' && 'bg-primary/10 text-primary',
          tone === 'warn' && 'bg-amber-500/15 text-amber-400',
          tone === 'danger' && 'bg-red-500/15 text-red-400',
        )}
      >
        {icon}
      </div>
      <div className="font-serif text-2xl text-foreground">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  )
}

export default ErpPanel
