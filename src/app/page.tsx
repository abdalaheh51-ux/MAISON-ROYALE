import { db } from '@/lib/db'
import type { CatalogDTO, ComponentCategory, ComponentOption } from '@/lib/types'
import { AtelierShell } from '@/components/sections/atelier-shell'
import { HeroParallax } from '@/components/sections/hero-parallax'
import { Reveal, StaggerGroup, StaggerItem, WordReveal } from '@/components/sections/motion-primitives'
import { formatUSD } from '@/lib/format'
import { ArrowDown, Gem, Hammer, Infinity as InfinityIcon, ShieldCheck } from 'lucide-react'

async function getCatalog(): Promise<CatalogDTO> {
  const model = await db.watchModel.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!model) throw new Error('No watch model seeded')

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

  return {
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
}

export default async function Home() {
  const catalog = await getCatalog()
  const { model } = catalog

  const collection = [
    {
      img: '/images/collection-1.png',
      name: 'Royale Noir',
      spec: 'Rose Gold · 42mm',
      price: '$6,400',
    },
    {
      img: '/images/collection-2.png',
      name: 'Ivoire Classique',
      spec: 'Steel · 40mm',
      price: '$4,950',
    },
    {
      img: '/images/collection-3.png',
      name: 'Profondeur Verte',
      spec: 'Black DLC · 44mm',
      price: '$7,200',
    },
  ]

  const pillars = [
    { icon: Gem, title: 'Hand-finished movement', body: 'Every caliber is assembled, regulated and signed by a single master watchmaker.' },
    { icon: Hammer, title: 'Bespoke composition', body: 'Dial, strap, hands and case are yours to specify — then cast, cut and stitched to order.' },
    { icon: ShieldCheck, title: 'Lifetime guardianship', body: 'A registered reference accompanies each piece for life, with service every five years.' },
    { icon: InfinityIcon, title: 'Heirloom warranty', body: 'Transferable across generations, because a Royale is built to outlast its first owner.' },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ───────── HEADER ───────── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-2">
            <span className="font-serif text-xl tracking-wide text-foreground">
              MAISON <span className="text-gold-gradient">ROYALE</span>
            </span>
          </a>
          <nav className="hidden items-center gap-8 text-xs uppercase tracking-luxe text-muted-foreground md:flex">
            <a href="#atelier" className="transition-colors hover:text-foreground">Atelier</a>
            <a href="#collection" className="transition-colors hover:text-foreground">Collection</a>
            <a href="#craft" className="transition-colors hover:text-foreground">Craft</a>
            <a href="#erp" className="transition-colors hover:text-foreground">ERP</a>
          </nav>
          <a
            href="#atelier"
            className="rounded-full border border-primary/40 bg-primary/10 px-5 py-2 text-xs uppercase tracking-luxe text-primary transition-all hover:bg-primary hover:text-primary-foreground"
          >
            Compose
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* ───────── HERO (parallax) ───────── */}
        <HeroParallax image="/images/hero.png">
          <div className="animate-[fadeUp_0.9s_ease-out]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/40 px-4 py-1.5 text-[11px] uppercase tracking-luxe text-primary backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Haute Horlogerie · Est. MMXXIV
            </div>
            <h1 className="max-w-3xl font-serif text-5xl leading-[1.05] text-foreground sm:text-6xl md:text-7xl">
              <WordReveal text="Compose a timepiece" />
              <br />
              <span className="text-gold-gradient italic">
                <WordReveal text="worthy of legacy." delay={0.25} />
              </span>
            </h1>
            <p className="mt-6 max-w-xl font-display text-xl leading-relaxed text-muted-foreground">
              {model.tagline} The {model.name} is not purchased — it is composed. Specify its
              dial, its strap, its hands and its case. Then watch your signature rendered, live.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#atelier"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium uppercase tracking-luxe text-primary-foreground transition-all hover:bg-primary/90"
              >
                Enter the atelier
                <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
              </a>
              <a
                href="#collection"
                className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm uppercase tracking-luxe text-foreground transition-all hover:border-primary/50"
              >
                View the collection
              </a>
            </div>
            <div className="mt-12 flex items-center gap-8 text-xs uppercase tracking-luxe text-muted-foreground">
              <span>From <span className="text-foreground">{formatUSD(model.basePrice)}</span></span>
              <span className="hidden h-4 w-px bg-border sm:block" />
              <span className="hidden sm:block">18 components · 4 axes</span>
              <span className="hidden h-4 w-px bg-border sm:block" />
              <span className="hidden sm:block">Swiss-made movement</span>
            </div>
          </div>
        </HeroParallax>

        {/* ───────── MANIFESTO ───────── */}
        <section className="border-y border-border/60 bg-card/20">
          <div className="mx-auto max-w-4xl px-6 py-20 text-center">
            <Reveal>
              <p className="font-display text-2xl leading-relaxed text-foreground sm:text-3xl">
                <WordReveal text={`“${model.description}“`} stagger={0.015} />
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mx-auto mt-8 h-px w-16 gold-hairline" />
              <p className="mt-6 text-xs uppercase tracking-luxe text-muted-foreground">
                The Maison Royale manifesto
              </p>
            </Reveal>
          </div>
        </section>

        {/* ───────── ATELIER (Configurator + ERP) ───────── */}
        <section id="atelier" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-24">
          <div className="mb-12 text-center">
            <Reveal>
              <div className="mb-3 text-[11px] uppercase tracking-luxe text-primary">
                The Atelier
              </div>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="font-serif text-4xl text-foreground sm:text-5xl">
                Compose your <span className="text-gold-gradient italic">{model.name}</span>
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Four axes of bespoke specification, rendered live. Every choice recalculates the
                price instantly — and every choice is bound to real atelier stock.
              </p>
            </Reveal>
          </div>

          <Reveal y={40} delay={0.1}>
            <AtelierShell initialCatalog={catalog} />
          </Reveal>
        </section>

        {/* ───────── PILLARS ───────── */}
        <section className="border-y border-border/60 bg-card/20">
          <StaggerGroup className="mx-auto grid max-w-7xl gap-px px-6 py-20 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => (
              <StaggerItem key={p.title} className="border-border/40 p-6 sm:border-r lg:last:border-r-0">
                <p.icon className="mb-4 h-7 w-7 text-primary" strokeWidth={1.4} />
                <h3 className="font-serif text-lg text-foreground">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>

        {/* ───────── COLLECTION ───────── */}
        <section id="collection" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-24">
          <div className="mb-12 flex flex-col items-end justify-between gap-4 sm:flex-row">
            <Reveal>
              <div>
                <div className="mb-3 text-[11px] uppercase tracking-luxe text-primary">
                  The Collection
                </div>
                <h2 className="font-serif text-4xl text-foreground sm:text-5xl">
                  Three signatures, one obsession
                </h2>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="max-w-md text-sm text-muted-foreground">
                Curated compositions by the maison — each available as a starting point for your own
                variation.
              </p>
            </Reveal>
          </div>

          <StaggerGroup className="grid gap-6 md:grid-cols-3" stagger={0.14}>
            {collection.map((c, i) => (
              <StaggerItem key={c.name}>
                <article className="group relative overflow-hidden rounded-2xl border border-border bg-card/40 transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5">
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={c.img}
                      alt={`${c.name} — ${c.spec}`}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                    <div className="absolute left-5 top-5 rounded-full border border-primary/30 bg-background/50 px-3 py-1 text-[11px] uppercase tracking-luxe text-primary backdrop-blur">
                      Edition {String(i + 1).padStart(2, '0')}
                    </div>
                  </div>
                  <div className="relative -mt-16 p-6">
                    <h3 className="font-serif text-2xl text-foreground">{c.name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-luxe text-muted-foreground">
                      {c.spec}
                    </p>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="font-serif text-lg text-gold-gradient">{c.price}</span>
                      <a
                        href="#atelier"
                        className="text-xs uppercase tracking-luxe text-primary transition-colors hover:text-foreground"
                      >
                        Compose similar →
                      </a>
                    </div>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>

        {/* ───────── CRAFT ───────── */}
        <section id="craft" className="relative overflow-hidden border-y border-border/60 bg-card/20">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-2">
            <Reveal y={40}>
              <div className="relative">
                <div className="overflow-hidden rounded-2xl border border-border">
                  <img
                    src="/images/atelier.png"
                    alt="Master watchmaker assembling a movement"
                    className="aspect-[1344/768] w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="absolute -bottom-5 -right-5 hidden rounded-xl border border-primary/30 bg-background/90 px-6 py-4 backdrop-blur sm:block">
                  <div className="font-serif text-3xl text-gold-gradient">432h</div>
                  <div className="text-[11px] uppercase tracking-luxe text-muted-foreground">
                    Per movement
                  </div>
                </div>
              </div>
            </Reveal>
            <div>
              <Reveal>
                <div className="mb-3 text-[11px] uppercase tracking-luxe text-primary">
                  The Craft
                </div>
              </Reveal>
              <Reveal delay={0.05}>
                <h2 className="font-serif text-4xl leading-tight text-foreground sm:text-5xl">
                  One bench.
                  <br />
                  <span className="text-gold-gradient italic">One pair of hands.</span>
                </h2>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                  Each {model.name} is entrusted to a single master watchmaker, from the first jewel
                  seated to the final regulation. There is no assembly line — only a bench, a loupe,
                  and the unhurried discipline of haute horlogerie.
                </p>
              </Reveal>
              <Reveal delay={0.18}>
                <p className="mt-4 text-muted-foreground">
                  The configurator you used above is bound, in real time, to that bench. When a strap
                  leather is spent, it vanishes from your options. When a dial is restocked, it
                  returns. The maison keeps no fiction between what it offers and what it can build.
                </p>
              </Reveal>
              <Reveal delay={0.22}>
                <div className="mt-8 grid grid-cols-3 gap-6 border-t border-border pt-8">
                  <Stat value="432h" label="Per movement" />
                  <Stat value="±2s" label="Daily variance" />
                  <Stat value="100m" label="Water resist." />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ───────── ERP NOTE ───────── */}
        <section id="erp" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-24 text-center">
          <Reveal>
            <div className="mb-3 text-[11px] uppercase tracking-luxe text-primary">
              Mini-ERP System
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-serif text-4xl text-foreground sm:text-5xl">
              What the configurator promises, the ledger enforces
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mx-auto mt-6 max-w-2xl text-muted-foreground">
              Switch to the <span className="text-foreground">ERP Inventory</span> tab inside the
              atelier to inspect live stock, restock a depleted dial, or consume a strap. Every
              change re-opens or closes options in the configurator instantly. Every confirmed order
              decrements four components inside a single database transaction.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <a
              href="#atelier"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary/40 px-7 py-3 text-sm uppercase tracking-luxe text-primary transition-all hover:bg-primary hover:text-primary-foreground"
            >
              Open the atelier & ERP
            </a>
          </Reveal>
        </section>
      </main>

      {/* ───────── FOOTER (sticky bottom) ───────── */}
      <footer className="mt-auto border-t border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="font-serif text-2xl text-foreground">
                MAISON <span className="text-gold-gradient">ROYALE</span>
              </div>
              <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                Haute horlogerie, composed. A maison where every timepiece is specified by its
                owner and assembled by a single hand.
              </p>
            </div>
            <div>
              <div className="mb-3 text-[11px] uppercase tracking-luxe text-muted-foreground">
                Maison
              </div>
              <ul className="space-y-2 text-sm text-foreground/80">
                <li><a href="#atelier" className="hover:text-primary">The Atelier</a></li>
                <li><a href="#collection" className="hover:text-primary">Collection</a></li>
                <li><a href="#craft" className="hover:text-primary">The Craft</a></li>
                <li><a href="#erp" className="hover:text-primary">ERP System</a></li>
              </ul>
            </div>
            <div>
              <div className="mb-3 text-[11px] uppercase tracking-luxe text-muted-foreground">
                Client services
              </div>
              <ul className="space-y-2 text-sm text-foreground/80">
                <li>Bespoke composition</li>
                <li>Lifetime guardianship</li>
                <li>Five-year service</li>
                <li>Private viewing</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
            <span>© {new Date().getFullYear()} Maison Royale. All rights reserved.</span>
            <span className="tracking-luxe uppercase">Geneva · Paris · Tokyo</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-serif text-2xl text-gold-gradient">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  )
}
