// Shared types between API and client for the luxury watch customizer.

export type ComponentCategory = 'dial' | 'strap' | 'hands' | 'case'

export interface DialConfig {
  color: string
  finish: 'sunburst' | 'matte' | 'guilloche'
  accent: string
}
export interface StrapConfig {
  type: 'leather' | 'metal' | 'rubber'
  color: string
  stitch: string
}
export interface HandsConfig {
  style: 'dauphine' | 'sword' | 'baton' | 'leaf'
  color: string
}
export interface CaseConfig {
  material: 'steel' | 'gold' | 'rose-gold' | 'black-steel'
  color: string
}

export interface ComponentOption {
  id: string
  category: ComponentCategory
  name: string
  config: DialConfig | StrapConfig | HandsConfig | CaseConfig
  priceDelta: number // cents
  stock: number
  lowStockAt: number
}

export interface WatchModelDTO {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  basePrice: number // cents
  heroImage: string | null
}

export interface CatalogDTO {
  model: WatchModelDTO
  components: Record<ComponentCategory, ComponentOption[]>
}

export interface OrderPayload {
  watchModelId: string
  componentIds: { dial: string; strap: string; hands: string; case: string }
  customerName?: string
}

export interface OrderResult {
  reference: string
  totalCents: number
  status: string
}
