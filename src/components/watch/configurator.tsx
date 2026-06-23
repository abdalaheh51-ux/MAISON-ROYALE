'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, Loader2, Package, RotateCcw, Sparkles, TriangleAlert } from 'lucide-react'
import { WatchSVG } from './watch-svg'
import type {
  CatalogDTO,
  ComponentCategory,
  ComponentOption,
  DialConfig,
  StrapConfig,
  HandsConfig,
  CaseConfig,
  OrderResult,
} from '@/lib/types'
import { formatUSD } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const CATEGORY_LABELS: Record<ComponentCategory, { label: string; sub: string }> = {
  dial: { label: 'Dial', sub: 'The face of the timepiece' },
  strap: { label: 'Strap', sub: 'Leather, metal or rubber' },
  hands: { label: 'Hands', sub: 'The signature silhouette' },
  case: { label: 'Case', sub: 'The architecture of metal' },
}

const CATEGORY_ORDER: ComponentCategory[] = ['dial', 'strap', 'hands', 'case']

export function Configurator({
  catalog,
  onOrderPlaced,
}: {
  catalog: CatalogDTO
  onOrderPlaced?: () => void
}) {
  const { model, components } = catalog

  // Available (stock > 0) options per category — sold-out items disappear live.
  const available = useMemo(() => {
    const out: Record<ComponentCategory, ComponentOption[]> = {
      dial: [],
      strap: [],
      hands: [],
      case: [],
    }
    for (const cat of CATEGORY_ORDER) {
      out[cat] = components[cat].filter((c) => c.stock > 0)
    }
    return out
  }, [components])

  const [selection, setSelection] = useState<Record<ComponentCategory, string | null>>({
    dial: null,
    strap: null,
    hands: null,
    case: null,
  })
  const [activeCategory, setActiveCategory] = useState<ComponentCategory>('dial')
  const [placing, setPlacing] = useState(false)
  const [lastOrder, setLastOrder] = useState<OrderResult | null>(null)

  // Initialise selection to first available option per category.
  useEffect(() => {
    setSelection({
      dial: available.dial[0]?.id ?? null,
      strap: available.strap[0]?.id ?? null,
      hands: available.hands[0]?.id ?? null,
      case: available.case[0]?.id ?? null,
    })
  }, [available])

  // Resolve selected component objects + their configs.
  const selected = useMemo(() => {
    const pick = (cat: ComponentCategory) =>
      components[cat].find((c) => c.id === selection[cat]) ?? null
    return {
      dial: pick('dial'),
      strap: pick('strap'),
      hands: pick('hands'),
      case: pick('case'),
    }
  }, [components, selection])

  const totalCents = useMemo(() => {
    if (!selected.dial || !selected.strap || !selected.hands || !selected.case) return model.basePrice
    return (
      model.basePrice +
      selected.dial.priceDelta +
      selected.strap.priceDelta +
      selected.hands.priceDelta +
      selected.case.priceDelta
    )
  }, [model, selected])

  const allSelected = Boolean(selected.dial && selected.strap && selected.hands && selected.case)

  function choose(cat: ComponentCategory, id: string) {
    setSelection((s) => ({ ...s, [cat]: id }))
  }

  function reset() {
    setSelection({
      dial: available.dial[0]?.id ?? null,
      strap: available.strap[0]?.id ?? null,
      hands: available.hands[0]?.id ?? null,
      case: available.case[0]?.id ?? null,
    })
    setLastOrder(null)
  }

  async function placeOrder() {
    if (!allSelected) return
    setPlacing(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watchModelId: model.id,
          componentIds: {
            dial: selected.dial!.id,
            strap: selected.strap!.id,
            hands: selected.hands!.id,
            case: selected.case!.id,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Order failed')
      setLastOrder(data as OrderResult)
      toast.success(`Order ${data.reference} confirmed`, {
        description: `Charged ${formatUSD(data.totalCents)}. Inventory decremented.`,
      })
      // Refresh catalog so stock + availability reflect the new state.
      onOrderPlaced?.()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Order failed'
      toast.error('Could not confirm order', { description: msg })
    } finally {
      setPlacing(false)
    }
  }

  // Render helpers per category type.
  function renderSwatch(cat: ComponentCategory, opt: ComponentOption) {
    const cfg = opt.config
    const isSelected = selection[cat] === opt.id
    const isLow = opt.stock > 0 && opt.stock <= opt.lowStockAt

    if (cat === 'dial') {
      const c = cfg as DialConfig
      return (
        <button
          key={opt.id}
          onClick={() => choose(cat, opt.id)}
          className={cn(
            'group relative flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all',
            isSelected
              ? 'border-primary bg-primary/10 shadow-[0_0_0_1px_var(--color-primary)]'
              : 'border-border bg-card/40 hover:border-primary/50 hover:bg-card',
          )}
        >
          <div className="flex w-full items-center gap-3">
            <span
              className="h-9 w-9 rounded-full border border-white/20 shadow-inner"
              style={{
                background: `radial-gradient(circle at 35% 30%, ${c.color}aa, ${c.color})`,
              }}
            />
            <div className="flex-1">
              <div className="font-serif text-sm text-foreground">{opt.name}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {c.finish}
              </div>
            </div>
            {isSelected && <Check className="h-4 w-4 text-primary" />}
          </div>
          <div className="flex w-full items-center justify-between text-[11px]">
            <span className="text-muted-foreground">
              {opt.priceDelta === 0 ? 'Included' : `+${formatUSD(opt.priceDelta)}`}
            </span>
            {isLow && (
              <span className="flex items-center gap-1 text-amber-400">
                <TriangleAlert className="h-3 w-3" /> {opt.stock} left
              </span>
            )}
          </div>
        </button>
      )
    }

    if (cat === 'strap') {
      const c = cfg as StrapConfig
      return (
        <button
          key={opt.id}
          onClick={() => choose(cat, opt.id)}
          className={cn(
            'group relative flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all',
            isSelected
              ? 'border-primary bg-primary/10 shadow-[0_0_0_1px_var(--color-primary)]'
              : 'border-border bg-card/40 hover:border-primary/50 hover:bg-card',
          )}
        >
          <div className="flex w-full items-center gap-3">
            <span
              className="h-9 w-9 rounded-md border border-white/20"
              style={{ background: `linear-gradient(135deg, ${c.color}, ${c.color}99)` }}
            />
            <div className="flex-1">
              <div className="font-serif text-sm text-foreground">{opt.name}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {c.type}
              </div>
            </div>
            {isSelected && <Check className="h-4 w-4 text-primary" />}
          </div>
          <div className="flex w-full items-center justify-between text-[11px]">
            <span className="text-muted-foreground">
              {opt.priceDelta === 0 ? 'Included' : `+${formatUSD(opt.priceDelta)}`}
            </span>
            {isLow && (
              <span className="flex items-center gap-1 text-amber-400">
                <TriangleAlert className="h-3 w-3" /> {opt.stock} left
              </span>
            )}
          </div>
        </button>
      )
    }

    if (cat === 'hands') {
      const c = cfg as HandsConfig
      return (
        <button
          key={opt.id}
          onClick={() => choose(cat, opt.id)}
          className={cn(
            'group relative flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all',
            isSelected
              ? 'border-primary bg-primary/10 shadow-[0_0_0_1px_var(--color-primary)]'
              : 'border-border bg-card/40 hover:border-primary/50 hover:bg-card',
          )}
        >
          <div className="flex w-full items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-md border border-white/20 bg-black/40"
              style={{ color: c.color }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                {c.style === 'dauphine' && <polygon points="12,2 15,12 12,22 9,12" />}
                {c.style === 'sword' && <polygon points="9,4 12,2 15,4 15,18 12,22 9,18" />}
                {c.style === 'baton' && <rect x="11" y="3" width="2" height="18" rx="1" />}
                {c.style === 'leaf' && <path d="M12 2 Q17 12 12 22 Q7 12 12 2 Z" />}
              </svg>
            </span>
            <div className="flex-1">
              <div className="font-serif text-sm text-foreground">{opt.name}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {c.style}
              </div>
            </div>
            {isSelected && <Check className="h-4 w-4 text-primary" />}
          </div>
          <div className="flex w-full items-center justify-between text-[11px]">
            <span className="text-muted-foreground">
              {opt.priceDelta === 0 ? 'Included' : `+${formatUSD(opt.priceDelta)}`}
            </span>
            {isLow && (
              <span className="flex items-center gap-1 text-amber-400">
                <TriangleAlert className="h-3 w-3" /> {opt.stock} left
              </span>
            )}
          </div>
        </button>
      )
    }

    // case
    const c = cfg as CaseConfig
    return (
      <button
        key={opt.id}
        onClick={() => choose(cat, opt.id)}
        className={cn(
          'group relative flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all',
          isSelected
            ? 'border-primary bg-primary/10 shadow-[0_0_0_1px_var(--color-primary)]'
            : 'border-border bg-card/40 hover:border-primary/50 hover:bg-card',
        )}
      >
        <div className="flex w-full items-center gap-3">
          <span
            className="h-9 w-9 rounded-full border border-white/30 shadow-inner"
            style={{
              background: `linear-gradient(135deg, ${c.color}, ${c.color}77)`,
            }}
          />
          <div className="flex-1">
            <div className="font-serif text-sm text-foreground">{opt.name}</div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {c.material.replace('-', ' ')}
            </div>
          </div>
          {isSelected && <Check className="h-4 w-4 text-primary" />}
        </div>
        <div className="flex w-full items-center justify-between text-[11px]">
          <span className="text-muted-foreground">
            {opt.priceDelta === 0 ? 'Included' : `+${formatUSD(opt.priceDelta)}`}
          </span>
          {isLow && (
            <span className="flex items-center gap-1 text-amber-400">
              <TriangleAlert className="h-3 w-3" /> {opt.stock} left
            </span>
          )}
        </div>
      </button>
    )
  }

  const soldOutCount = useMemo(
    () =>
      CATEGORY_ORDER.reduce(
        (sum, cat) => sum + components[cat].filter((c) => c.stock === 0).length,
        0,
      ),
    [components],
  )

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
      {/* LEFT — the live watch + summary */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card to-background p-6 grain-overlay">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selected.dial?.id}-${selected.strap?.id}-${selected.hands?.id}-${selected.case?.id}`}
                initial={{ opacity: 0, scale: 0.96, rotateY: -8 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto max-w-[340px]"
              >
                {selected.dial && selected.strap && selected.hands && selected.case ? (
                  <WatchSVG
                    dial={selected.dial.config as DialConfig}
                    strap={selected.strap.config as StrapConfig}
                    hands={selected.hands.config as HandsConfig}
                    caseCfg={selected.case.config as CaseConfig}
                    className="h-auto w-full drop-shadow-2xl"
                  />
                ) : (
                  <div className="flex aspect-[360/520] items-center justify-center text-muted-foreground">
                    Select options to preview
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
              <div>
                <div className="text-[11px] uppercase tracking-luxe text-muted-foreground">
                  Your configuration
                </div>
                <div className="font-serif text-lg text-foreground">{model.name}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-luxe text-muted-foreground">
                  Total
                </div>
                <motion.div
                  key={totalCents}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-serif text-2xl text-gold-gradient"
                >
                  {formatUSD(totalCents)}
                </motion.div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {selected.dial && (
                <Badge variant="outline" className="border-primary/30 text-primary/90">
                  {selected.dial.name}
                </Badge>
              )}
              {selected.strap && (
                <Badge variant="outline" className="border-primary/30 text-primary/90">
                  {selected.strap.name}
                </Badge>
              )}
              {selected.hands && (
                <Badge variant="outline" className="border-primary/30 text-primary/90">
                  {selected.hands.name}
                </Badge>
              )}
              {selected.case && (
                <Badge variant="outline" className="border-primary/30 text-primary/90">
                  {selected.case.name}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* price breakdown */}
        <div className="mt-4 rounded-xl border border-border bg-card/40 p-4 text-sm">
          <div className="mb-2 text-[11px] uppercase tracking-luxe text-muted-foreground">
            Price composition
          </div>
          <div className="space-y-1.5">
            <Row label={`${model.name} base`} value={formatUSD(model.basePrice)} />
            {selected.dial && selected.dial.priceDelta !== 0 && (
              <Row label={selected.dial.name} value={`+${formatUSD(selected.dial.priceDelta)}`} />
            )}
            {selected.strap && selected.strap.priceDelta !== 0 && (
              <Row label={selected.strap.name} value={`+${formatUSD(selected.strap.priceDelta)}`} />
            )}
            {selected.hands && selected.hands.priceDelta !== 0 && (
              <Row label={selected.hands.name} value={`+${formatUSD(selected.hands.priceDelta)}`} />
            )}
            {selected.case && selected.case.priceDelta !== 0 && (
              <Row label={selected.case.name} value={`+${formatUSD(selected.case.priceDelta)}`} />
            )}
          </div>
        </div>
      </div>

      {/* RIGHT — option selector */}
      <div>
        {/* category tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {CATEGORY_ORDER.map((cat) => {
            const soldOutInCat = components[cat].filter((c) => c.stock === 0).length
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'group flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-luxe transition-all',
                  activeCategory === cat
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
                )}
              >
                {CATEGORY_LABELS[cat].label}
                {soldOutInCat > 0 && (
                  <span className="rounded-full bg-amber-500/20 px-1.5 text-[10px] text-amber-300">
                    {soldOutInCat} out
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-4">
              <h3 className="font-serif text-2xl text-foreground">
                {CATEGORY_LABELS[activeCategory].label}
              </h3>
              <p className="text-sm text-muted-foreground">
                {CATEGORY_LABELS[activeCategory].sub}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {available[activeCategory].map((opt) => renderSwatch(activeCategory, opt))}
            </div>

            {available[activeCategory].length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                <Package className="mx-auto mb-2 h-6 w-6" />
                Every {CATEGORY_LABELS[activeCategory].label.toLowerCase()} option is currently
                sold out. Restock from the ERP panel.
              </div>
            )}

            {/* show what's been hidden due to stock */}
            {components[activeCategory].some((c) => c.stock === 0) && (
              <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300/80">
                <div className="mb-1 flex items-center gap-1.5 font-medium text-amber-300">
                  <TriangleAlert className="h-3.5 w-3.5" /> Hidden from configurator (sold out)
                </div>
                {components[activeCategory]
                  .filter((c) => c.stock === 0)
                  .map((c) => (
                    <span key={c.id} className="mr-2 inline-block text-amber-300/60">
                      {c.name}
                    </span>
                  ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            onClick={placeOrder}
            disabled={!allSelected || placing}
            size="lg"
            className="group relative flex-1 overflow-hidden bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {placing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> Confirm Configuration ·{' '}
                {formatUSD(totalCents)}
                <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
          <Button
            onClick={reset}
            variant="outline"
            size="lg"
            className="border-border text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>

        {lastOrder && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4"
          >
            <div className="flex items-center gap-2 text-primary">
              <Check className="h-4 w-4" />
              <span className="font-serif text-sm">Order {lastOrder.reference}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Your timepiece enters the atelier. Reference{' '}
              <span className="text-foreground">{lastOrder.reference}</span> ·{' '}
              {formatUSD(lastOrder.totalCents)}. Component stock has been decremented — watch the
              ERP panel.
            </p>
          </motion.div>
        )}

        {soldOutCount > 0 && (
          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            {soldOutCount} option{soldOutCount > 1 ? 's' : ''} currently hidden from the
            configurator due to depleted stock.
          </p>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
