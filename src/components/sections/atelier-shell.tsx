'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings2, Sparkles } from 'lucide-react'
import { Configurator } from '@/components/watch/configurator'
import { ErpPanel } from '@/components/watch/erp-panel'
import type { CatalogDTO } from '@/lib/types'
import { cn } from '@/lib/utils'

type Tab = 'atelier' | 'inventory'

export function AtelierShell({ initialCatalog }: { initialCatalog: CatalogDTO }) {
  const [catalog, setCatalog] = useState<CatalogDTO>(initialCatalog)
  const [tab, setTab] = useState<Tab>('atelier')
  const [refreshing, setRefreshing] = useState(false)

  const refreshCatalog = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/catalog', { cache: 'no-store' })
      if (res.ok) setCatalog((await res.json()) as CatalogDTO)
    } catch {
      /* ignore — keep stale */
    } finally {
      setRefreshing(false)
    }
  }, [])

  // Re-sync if the server-side initial ever changes (e.g. HMR).
  useEffect(() => {
    setCatalog(initialCatalog)
  }, [initialCatalog])

  return (
    <div>
      {/* tab switcher */}
      <div className="mb-10 flex flex-col items-center gap-4">
        <div className="inline-flex rounded-full border border-border bg-card/40 p-1">
          <TabButton
            active={tab === 'atelier'}
            onClick={() => setTab('atelier')}
            icon={<Sparkles className="h-3.5 w-3.5" />}
            label="The Atelier"
          />
          <TabButton
            active={tab === 'inventory'}
            onClick={() => setTab('inventory')}
            icon={<Settings2 className="h-3.5 w-3.5" />}
            label="ERP Inventory"
          />
        </div>
        {refreshing && (
          <span className="text-[11px] uppercase tracking-luxe text-primary/70">
            Syncing inventory…
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
        >
          {tab === 'atelier' ? (
            <Configurator catalog={catalog} onOrderPlaced={refreshCatalog} />
          ) : (
            <ErpPanel onInventoryChanged={refreshCatalog} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-full px-5 py-2 text-xs uppercase tracking-luxe transition-all',
        active
          ? 'bg-primary text-primary-foreground shadow'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {icon}
      {label}
    </button>
  )
}

export default AtelierShell
