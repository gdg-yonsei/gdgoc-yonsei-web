import type { CSSProperties, ReactNode } from 'react'

export type PartGlyphKind =
  'layout' | 'layers' | 'graph' | 'mesh' | 'curve' | 'rings'

const NODES: ReadonlyArray<readonly [number, number]> = [
  [18, 36],
  [50, 14],
  [50, 58],
  [84, 36],
  [104, 18],
]

const GLYPHS: Record<PartGlyphKind, ReactNode> = {
  layout: (
    <>
      <rect x="6" y="6" width="108" height="12" rx="4" className="pg-soft" />
      <rect x="6" y="24" width="32" height="42" rx="4" className="pg-accent" />
      <rect
        x="44"
        y="24"
        width="70"
        height="18"
        rx="4"
        className="pg-soft pg-swap-a"
      />
      <rect
        x="44"
        y="48"
        width="70"
        height="18"
        rx="4"
        className="pg-soft pg-swap-b"
      />
    </>
  ),
  layers: (
    <>
      <path d="M16 48 60 64 104 48" className="pg-line pg-layer-low" />
      <path d="M16 36 60 52 104 36" className="pg-line" />
      <path d="M60 8 104 24 60 40 16 24Z" className="pg-accent pg-layer-top" />
    </>
  ),
  graph: (
    <>
      <path
        d="M18 36 50 14M18 36 50 58M50 14 84 36M50 58 84 36M84 36 104 18"
        className="pg-line"
      />
      {NODES.map(([cx, cy], index) => (
        <circle
          key={index}
          cx={cx}
          cy={cy}
          r="6"
          className="pg-accent pg-node"
          style={{ '--n': index } as CSSProperties}
        />
      ))}
    </>
  ),
  mesh: (
    <g className="pg-mesh">
      <path
        d="M10 14h100M10 36h100M10 58h100M20 6v60M46 6v60M72 6v60M98 6v60"
        className="pg-line"
      />
      <circle cx="46" cy="36" r="5" className="pg-accent" />
      <circle cx="72" cy="14" r="5" className="pg-accent" />
      <circle cx="98" cy="58" r="5" className="pg-accent" />
    </g>
  ),
  curve: (
    <>
      <path d="M12 60 40 8M108 12 80 64" className="pg-line" />
      <rect x="36" y="4" width="8" height="8" className="pg-soft" />
      <rect x="76" y="60" width="8" height="8" className="pg-soft" />
      <path
        d="M12 60C40 8 80 64 108 12"
        pathLength={1}
        className="pg-stroke pg-draw"
      />
      <circle cx="12" cy="60" r="5" className="pg-accent" />
      <circle cx="108" cy="12" r="5" className="pg-accent" />
      {/* Rides the curve on hover (parts scene). */}
      <circle cx="0" cy="0" r="4" className="pg-rider" />
    </>
  ),
  rings: (
    <>
      <circle cx="60" cy="36" r="7" className="pg-accent" />
      {[16, 25, 34].map((r, index) => (
        <circle
          key={r}
          cx="60"
          cy="36"
          r={r}
          className="pg-ring"
          style={{ '--n': index } as CSSProperties}
        />
      ))}
    </>
  ),
}

/**
 * Generated line art per part: layout boxes, layers, a node graph, a mesh,
 * a bézier curve and broadcast rings. Animated on hover or focus
 * (site-home.css).
 */
export default function PartGlyph({ kind }: { kind: PartGlyphKind }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 120 72"
      className="part-glyph"
    >
      {GLYPHS[kind]}
    </svg>
  )
}
