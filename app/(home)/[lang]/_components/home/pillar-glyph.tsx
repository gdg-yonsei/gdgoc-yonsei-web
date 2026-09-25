export type PillarKind = 'community' | 'tech' | 'growth'

const CHEVRON_LEFT = 'M18 8 6 20l12 12'
const CHEVRON_RIGHT = 'm46 8 12 12-12 12'

/** Hidden outlines the manifesto scene morphs the tech chevrons between:
    `{ }` braces on hover, the chevrons themselves on the way back. */
const MORPH_TARGETS = {
  'brace-left': 'M18 8c-4 0-5 2-5 5v3c0 2-1 4-5 4 4 0 5 2 5 4v3c0 3 1 5 5 5',
  'brace-right': 'M46 8c4 0 5 2 5 5v3c0 2 1 4 5 4-4 0-5 2-5 4v3c0 3-1 5-5 5',
  'chevron-left': CHEVRON_LEFT,
  'chevron-right': CHEVRON_RIGHT,
}

/** Small decorative glyph per pillar, animated on hover (site-home.css and
    the manifesto scene). */
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
          <path d={CHEVRON_LEFT} className="glyph-stroke-blue" />
          <path d={CHEVRON_RIGHT} className="glyph-stroke-green" />
          <rect
            x="29"
            y="10"
            width="5"
            height="20"
            rx="2"
            className="glyph-caret"
          />
          {Object.entries(MORPH_TARGETS).map(([name, d]) => (
            <path key={name} d={d} data-morph={name} className="glyph-morph" />
          ))}
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
