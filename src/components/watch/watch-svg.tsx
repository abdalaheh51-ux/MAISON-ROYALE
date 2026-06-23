'use noinit'
/**
 * WatchSVG — a fully parameterized SVG renderer for the Chronograph Royale.
 * Receives the 4 component configs (dial / strap / hands / case) and draws a
 * luxury timepiece in real time. No images — every pixel is computed, so the
 * configurator updates instantly with zero asset loading.
 */
import type {
  DialConfig,
  StrapConfig,
  HandsConfig,
  CaseConfig,
} from '@/lib/types'

interface WatchSVGProps {
  dial: DialConfig
  strap: StrapConfig
  hands: HandsConfig
  caseCfg: CaseConfig
  className?: string
}

const CX = 180
const CY = 260
const CASE_R = 128
const BEZEL_R = 118
const DIAL_R = 106

function caseGradient(material: CaseConfig['material']) {
  switch (material) {
    case 'gold':
      return { c1: '#f7dd77', c2: '#9c7a18', c3: '#e8c84a' }
    case 'rose-gold':
      return { c1: '#f0c4a6', c2: '#a85e3c', c3: '#dba079' }
    case 'black-steel':
      return { c1: '#34343a', c2: '#070708', c3: '#1c1c20' }
    case 'steel':
    default:
      return { c1: '#e2e2e8', c2: '#7c7c84', c3: '#bcbcc4' }
  }
}

// Lighten/darken hex by amount (-1..1)
function shade(hex: string, amt: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const f = (v: number) =>
    Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))))
  return `#${f(r).toString(16).padStart(2, '0')}${f(g).toString(16).padStart(2, '0')}${f(b)
    .toString(16)
    .padStart(2, '0')}`
}

// 12 hour markers — batons, with thicker cardinals.
function HourMarkers({ accent }: { accent: string }) {
  const markers = []
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2
    const isCardinal = i % 3 === 0
    const rOuter = DIAL_R - 8
    const rInner = isCardinal ? DIAL_R - 26 : DIAL_R - 18
    const x1 = CX + Math.cos(angle) * rOuter
    const y1 = CY + Math.sin(angle) * rOuter
    const x2 = CX + Math.cos(angle) * rInner
    const y2 = CY + Math.sin(angle) * rInner
    markers.push(
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={accent}
        strokeWidth={isCardinal ? 3.4 : 1.8}
        strokeLinecap="round"
        opacity={isCardinal ? 0.95 : 0.7}
      />,
    )
  }
  return <g>{markers}</g>
}

function MinuteTicks({ accent }: { accent: string }) {
  const ticks = []
  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) continue
    const angle = (i / 60) * Math.PI * 2 - Math.PI / 2
    const x1 = CX + Math.cos(angle) * (DIAL_R - 6)
    const y1 = CY + Math.sin(angle) * (DIAL_R - 6)
    const x2 = CX + Math.cos(angle) * (DIAL_R - 12)
    const y2 = CY + Math.sin(angle) * (DIAL_R - 12)
    ticks.push(
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeWidth={0.8} opacity={0.4} />,
    )
  }
  return <g>{ticks}</g>
}

function DialFinish({ config }: { config: DialConfig }) {
  const { color, finish } = config
  if (finish === 'sunburst') {
    const lines = []
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * Math.PI * 2
      lines.push(
        <line
          key={i}
          x1={CX}
          y1={CY}
          x2={CX + Math.cos(a) * DIAL_R}
          y2={CY + Math.sin(a) * DIAL_R}
          stroke={i % 2 === 0 ? shade(color, 0.18) : shade(color, -0.12)}
          strokeWidth={1.1}
          opacity={0.5}
        />,
      )
    }
    return <g opacity={0.85}>{lines}</g>
  }
  if (finish === 'guilloche') {
    const rings = []
    for (let r = 8; r < DIAL_R; r += 6) {
      rings.push(
        <circle
          key={r}
          cx={CX}
          cy={CY}
          r={r}
          fill="none"
          stroke={shade(color, 0.12)}
          strokeWidth={0.6}
          opacity={0.45}
        />,
      )
    }
    return <g>{rings}</g>
  }
  // matte — subtle vignette only
  return (
    <radialGradient id="matteVig" cx="50%" cy="42%" r="65%">
      <stop offset="0%" stopColor={shade(color, 0.08)} />
      <stop offset="100%" stopColor={shade(color, -0.25)} />
    </radialGradient>
  )
}

function Hand({
  angle,
  length,
  width,
  color,
  style,
}: {
  angle: number
  length: number
  width: number
  color: string
  style: HandsConfig['style']
}) {
  const tipY = CY - length
  const baseY = CY + 8
  let shape: React.ReactNode

  if (style === 'dauphine') {
    shape = (
      <polygon
        points={`${CX},${tipY} ${CX + width / 2},${CY - length * 0.35} ${CX + width / 3},${baseY} ${CX - width / 3},${baseY} ${CX - width / 2},${CY - length * 0.35}`}
        fill={color}
        stroke={shade(color, -0.35)}
        strokeWidth={0.6}
      />
    )
  } else if (style === 'sword') {
    shape = (
      <polygon
        points={`${CX - width / 2},${CY} ${CX - width / 2},${CY - length * 0.55} ${CX},${tipY} ${CX + width / 2},${CY - length * 0.55} ${CX + width / 2},${CY} ${CX + width / 3},${baseY} ${CX - width / 3},${baseY}`}
        fill={color}
        stroke={shade(color, -0.35)}
        strokeWidth={0.6}
      />
    )
  } else if (style === 'baton') {
    shape = (
      <g>
        <rect
          x={CX - width / 2}
          y={tipY}
          width={width}
          height={length + 8}
          rx={width / 2}
          fill={color}
          stroke={shade(color, -0.35)}
          strokeWidth={0.6}
        />
        <rect
          x={CX - width / 6}
          y={tipY + 6}
          width={width / 3}
          height={length * 0.6}
          rx={width / 6}
          fill={shade(color, 0.5)}
          opacity={0.8}
        />
      </g>
    )
  } else {
    // leaf
    shape = (
      <path
        d={`M ${CX} ${tipY} Q ${CX + width / 2} ${CY - length * 0.45}, ${CX + width / 3} ${baseY} L ${CX - width / 3} ${baseY} Q ${CX - width / 2} ${CY - length * 0.45}, ${CX} ${tipY} Z`}
        fill={color}
        stroke={shade(color, -0.35)}
        strokeWidth={0.6}
      />
    )
  }

  return <g transform={`rotate(${angle} ${CX} ${CY})`}>{shape}</g>
}

function Strap({ config }: { config: StrapConfig }) {
  const { type, color, stitch } = config

  if (type === 'metal') {
    const links = []
    const linkCount = 6
    for (const half of ['top', 'bottom']) {
      const dir = half === 'top' ? -1 : 1
      const startY = half === 'top' ? 150 : 350
      for (let i = 0; i < linkCount; i++) {
        const y = startY + dir * i * 30
        const taper = 1 - i * 0.06
        const w = 92 * taper
        const h = 24
        links.push(
          <g key={`${half}-${i}`}>
            <rect
              x={CX - w / 2}
              y={y - h / 2}
              width={w}
              height={h}
              rx={8}
              fill="url(#strapMetal)"
              stroke={shade(color, -0.4)}
              strokeWidth={0.8}
            />
            <rect
              x={CX - w / 2 + 4}
              y={y - h / 2 + 3}
              width={w - 8}
              height={3}
              rx={1.5}
              fill={shade(color, 0.35)}
              opacity={0.7}
            />
          </g>,
        )
      }
    }
    return (
      <g>
        <linearGradient id="strapMetal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={shade(color, -0.35)} />
          <stop offset="35%" stopColor={shade(color, 0.3)} />
          <stop offset="65%" stopColor={shade(color, 0.3)} />
          <stop offset="100%" stopColor={shade(color, -0.35)} />
        </linearGradient>
        {links}
      </g>
    )
  }

  const isRubber = type === 'rubber'
  const topPath = `M ${CX - 52} 168 L ${CX - 46} 30 Q ${CX - 46} 8, ${CX - 38} 4 L ${CX + 38} 4 Q ${CX + 46} 8, ${CX + 46} 30 L ${CX + 52} 168 Z`
  const botPath = `M ${CX - 52} 352 L ${CX - 46} 490 Q ${CX - 46} 512, ${CX - 38} 516 L ${CX + 38} 516 Q ${CX + 46} 512, ${CX + 46} 490 L ${CX + 52} 352 Z`

  return (
    <g>
      <linearGradient id="strapGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={shade(color, -0.45)} />
        <stop offset="50%" stopColor={shade(color, 0.08)} />
        <stop offset="100%" stopColor={shade(color, -0.45)} />
      </linearGradient>
      <path d={topPath} fill="url(#strapGrad)" stroke={shade(color, -0.6)} strokeWidth={0.8} />
      <path d={botPath} fill="url(#strapGrad)" stroke={shade(color, -0.6)} strokeWidth={0.8} />

      {!isRubber &&
        [168, 140, 110, 80, 50, 20].map((y, i) => (
          <g key={`ts-${i}`}>
            <circle cx={CX - 40} cy={y} r={1.4} fill={stitch} opacity={0.85} />
            <circle cx={CX + 40} cy={y} r={1.4} fill={stitch} opacity={0.85} />
          </g>
        ))}
      {!isRubber &&
        [352, 382, 412, 442, 472, 502].map((y, i) => (
          <g key={`bs-${i}`}>
            <circle cx={CX - 40} cy={y} r={1.4} fill={stitch} opacity={0.85} />
            <circle cx={CX + 40} cy={y} r={1.4} fill={stitch} opacity={0.85} />
          </g>
        ))}

      {isRubber &&
        Array.from({ length: 9 }).map((_, i) => (
          <g key={`rub-${i}`}>
            <line x1={CX - 42} y1={28 + i * 16} x2={CX + 42} y2={28 + i * 16} stroke={shade(color, -0.6)} strokeWidth={1.5} opacity={0.6} />
            <line x1={CX - 42} y1={372 + i * 16} x2={CX + 42} y2={372 + i * 16} stroke={shade(color, -0.6)} strokeWidth={1.5} opacity={0.6} />
          </g>
        ))}
      {isRubber && (
        <>
          <line x1={CX - 42} y1={20} x2={CX + 42} y2={20} stroke={stitch} strokeWidth={1.5} opacity={0.7} />
          <line x1={CX - 42} y1={500} x2={CX + 42} y2={500} stroke={stitch} strokeWidth={1.5} opacity={0.7} />
        </>
      )}
    </g>
  )
}

export function WatchSVG({ dial, strap, hands, caseCfg, className }: WatchSVGProps) {
  const g = caseGradient(caseCfg.material)
  const accent = dial.accent

  return (
    <svg
      viewBox="0 0 360 520"
      className={className}
      role="img"
      aria-label={`Chronograph Royale with ${dial.finish} dial, ${strap.type} strap, ${hands.style} hands and ${caseCfg.material} case`}
    >
      <defs>
        <linearGradient id="caseMetal" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor={g.c1} />
          <stop offset="45%" stopColor={g.c3} />
          <stop offset="100%" stopColor={g.c2} />
        </linearGradient>
        <radialGradient id="dialShine" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor={shade(dial.color, 0.25)} />
          <stop offset="55%" stopColor={dial.color} />
          <stop offset="100%" stopColor={shade(dial.color, -0.4)} />
        </radialGradient>
        <radialGradient id="glassHL" cx="35%" cy="25%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="8" />
          <feOffset dx="0" dy="10" result="off" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.55" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ambient floor shadow */}
      <ellipse cx={CX} cy={475} rx={120} ry={14} fill="#000" opacity={0.5} />

      <Strap config={strap} />

      {/* lugs */}
      <g fill="url(#caseMetal)" stroke={shade(g.c2, -0.3)} strokeWidth={0.8}>
        <path d={`M ${CX - 78} ${CY - 92} L ${CX - 50} ${CY - 118} L ${CX - 40} ${CY - 96} L ${CX - 68} ${CY - 74} Z`} />
        <path d={`M ${CX + 78} ${CY - 92} L ${CX + 50} ${CY - 118} L ${CX + 40} ${CY - 96} L ${CX + 68} ${CY - 74} Z`} />
        <path d={`M ${CX - 78} ${CY + 92} L ${CX - 50} ${CY + 118} L ${CX - 40} ${CY + 96} L ${CX - 68} ${CY + 74} Z`} />
        <path d={`M ${CX + 78} ${CY + 92} L ${CX + 50} ${CY + 118} L ${CX + 40} ${CY + 96} L ${CX + 68} ${CY + 74} Z`} />
      </g>

      {/* case outer */}
      <circle cx={CX} cy={CY} r={CASE_R} fill="url(#caseMetal)" filter="url(#softShadow)" />
      <circle cx={CX} cy={CY} r={CASE_R} fill="none" stroke={shade(g.c2, -0.4)} strokeWidth={1.2} />

      {/* bezel with engraved ticks */}
      <circle cx={CX} cy={CY} r={BEZEL_R} fill={shade(g.c2, -0.2)} />
      <circle cx={CX} cy={CY} r={BEZEL_R - 4} fill={shade(g.c1, 0.05)} />
      {Array.from({ length: 120 }).map((_, i) => {
        const a = (i / 120) * Math.PI * 2 - Math.PI / 2
        const x1 = CX + Math.cos(a) * (BEZEL_R - 1)
        const y1 = CY + Math.sin(a) * (BEZEL_R - 1)
        const x2 = CX + Math.cos(a) * (BEZEL_R - 4)
        const y2 = CY + Math.sin(a) * (BEZEL_R - 4)
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={shade(g.c2, -0.5)} strokeWidth={i % 5 === 0 ? 1 : 0.4} opacity={0.8} />
        )
      })}

      {/* crown */}
      <g>
        <rect x={CX + CASE_R - 4} y={CY - 9} width={14} height={18} rx={3} fill="url(#caseMetal)" stroke={shade(g.c2, -0.4)} strokeWidth={0.6} />
        <circle cx={CX + CASE_R + 12} cy={CY} r={8} fill="url(#caseMetal)" stroke={shade(g.c2, -0.4)} strokeWidth={0.6} />
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2
          return (
            <line
              key={i}
              x1={CX + CASE_R + 12 + Math.cos(a) * 5}
              y1={CY + Math.sin(a) * 5}
              x2={CX + CASE_R + 12 + Math.cos(a) * 8}
              y2={CY + Math.sin(a) * 8}
              stroke={shade(g.c2, -0.5)}
              strokeWidth={1}
            />
          )
        })}
      </g>

      {/* chronograph pushers */}
      <rect x={CX + CASE_R - 2} y={CY - 70} width={10} height={10} rx={2} fill="url(#caseMetal)" stroke={shade(g.c2, -0.4)} strokeWidth={0.5} />
      <rect x={CX + CASE_R - 2} y={CY + 60} width={10} height={10} rx={2} fill="url(#caseMetal)" stroke={shade(g.c2, -0.4)} strokeWidth={0.5} />

      {/* dial */}
      <circle cx={CX} cy={CY} r={DIAL_R} fill="url(#dialShine)" />
      <DialFinish config={dial} />
      {dial.finish === 'matte' && <circle cx={CX} cy={CY} r={DIAL_R} fill="url(#matteVig)" />}

      {/* chapter ring */}
      <circle cx={CX} cy={CY} r={DIAL_R - 4} fill="none" stroke={shade(dial.color, -0.3)} strokeWidth={0.6} opacity={0.6} />

      <MinuteTicks accent={accent} />
      <HourMarkers accent={accent} />

      {/* sub-dials (chronograph) */}
      <g>
        <circle cx={CX} cy={CY - 40} r={22} fill={shade(dial.color, -0.25)} stroke={accent} strokeWidth={0.8} opacity={0.9} />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2
          return (
            <line key={i} x1={CX + Math.cos(a) * 18} y1={CY - 40 + Math.sin(a) * 18} x2={CX + Math.cos(a) * 20} y2={CY - 40 + Math.sin(a) * 20} stroke={accent} strokeWidth={0.5} opacity={0.6} />
          )
        })}
        <line x1={CX} y1={CY - 40} x2={CX + 13} y2={CY - 40} stroke={hands.color} strokeWidth={1.2} />

        <circle cx={CX - 42} cy={CY + 34} r={18} fill={shade(dial.color, -0.25)} stroke={accent} strokeWidth={0.8} opacity={0.9} />
        <circle cx={CX + 42} cy={CY + 34} r={18} fill={shade(dial.color, -0.25)} stroke={accent} strokeWidth={0.8} opacity={0.9} />
        {[
          [CX - 42, CY + 34],
          [CX + 42, CY + 34],
        ].map(([sx, sy], idx) => (
          <g key={idx}>
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i / 8) * Math.PI * 2 - Math.PI / 2
              return <line key={i} x1={sx + Math.cos(a) * 14} y1={sy + Math.sin(a) * 14} x2={sx + Math.cos(a) * 16} y2={sy + Math.sin(a) * 16} stroke={accent} strokeWidth={0.4} opacity={0.5} />
            })}
          </g>
        ))}
      </g>

      {/* date window */}
      <rect x={CX + 70} y={CY - 9} width={18} height={18} rx={2} fill={shade(dial.color, 0.6)} stroke={accent} strokeWidth={0.6} />
      <text x={CX + 79} y={CY + 5} textAnchor="middle" fontSize={12} fill={shade(dial.color, -0.6)} fontWeight={600}>14</text>

      {/* brand text */}
      <text x={CX} y={CY - 60} textAnchor="middle" fontSize={11} fontFamily="var(--font-playfair), serif" fill={accent} letterSpacing="3" opacity={0.95}>MAISON ROYALE</text>
      <text x={CX} y={CY - 46} textAnchor="middle" fontSize={6} fill={accent} letterSpacing="4" opacity={0.7}>CHRONOGRAPH</text>
      <text x={CX} y={CY + 78} textAnchor="middle" fontSize={5.5} fill={accent} letterSpacing="3" opacity={0.55}>AUTOMATIC · SWISS MADE</text>

      {/* hands at 10:10 */}
      <Hand angle={305} length={58} width={8} color={hands.color} style={hands.style} />
      <Hand angle={60} length={84} width={7} color={hands.color} style={hands.style} />
      <Hand angle={318} length={92} width={1.6} color="#d64545" style="baton" />

      {/* center cap */}
      <circle cx={CX} cy={CY} r={5.5} fill={hands.color} stroke={shade(hands.color, -0.4)} strokeWidth={0.8} />
      <circle cx={CX} cy={CY} r={2} fill={shade(hands.color, -0.4)} />

      {/* sapphire crystal highlight */}
      <circle cx={CX} cy={CY} r={DIAL_R} fill="url(#glassHL)" pointerEvents="none" />
      <ellipse cx={CX - 38} cy={CY - 56} rx={46} ry={26} fill="#ffffff" opacity={0.06} transform={`rotate(-28 ${CX - 38} ${CY - 56})`} />
    </svg>
  )
}

export default WatchSVG
