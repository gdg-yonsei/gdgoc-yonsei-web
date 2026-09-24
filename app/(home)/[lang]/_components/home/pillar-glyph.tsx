export type PillarKind = 'community' | 'tech' | 'growth'

/** Small decorative glyph per pillar, animated on hover (site-home.css). */
export default function PillarGlyph({ kind }: { kind: PillarKind }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 64 40"
      className="pillar-glyph"
    >
      {kind === 'community' && (
        <>
          <circle cx="20" cy="20" r="11" className="glyph-fill-blue" />
          <circle cx="32" cy="20" r="11" className="glyph-fill-red" />
          <circle cx="44" cy="20" r="11" className="glyph-fill-yellow" />
        </>
      )}
      {kind === 'tech' && (
        <>
          <path d="M18 8 6 20l12 12" className="glyph-stroke-blue" />
          <path d="m46 8 12 12-12 12" className="glyph-stroke-green" />
          <rect
            x="29"
            y="10"
            width="5"
            height="20"
            rx="2"
            className="glyph-caret"
          />
        </>
      )}
      {kind === 'growth' && (
        <>
          <rect
            x="10"
            y="24"
            width="10"
            height="12"
            rx="3"
            className="glyph-bar"
          />
          <rect
            x="27"
            y="16"
            width="10"
            height="20"
            rx="3"
            className="glyph-bar"
          />
          <rect
            x="44"
            y="6"
            width="10"
            height="30"
            rx="3"
            className="glyph-bar"
          />
        </>
      )}
    </svg>
  )
}
