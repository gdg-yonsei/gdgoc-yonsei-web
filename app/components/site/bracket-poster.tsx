import {
  BRACKET_VIEWBOX,
  bracketCapsulesInViewBox,
  capsulePath,
  type BracketSide,
  type CapsuleHue,
} from '@/lib/site/bracket-geometry'
import { cn } from '@/lib/cn'

const HUE_FILL: Record<CapsuleHue, string> = {
  red: '#EA4335',
  blue: '#4285F4',
  yellow: '#F9AB00',
  green: '#34A853',
}

/**
 * One GDG bracket drawn as a halftone print: a faint solid tint under the
 * same capsules masked to a dot grid with CSS. Server-rendered so the hero
 * paints without JS. SVG <pattern> fills are avoided on purpose: Chromium
 * rasterised them as full-width white bands once the mark grew past ~150px.
 */
export default function BracketPoster({
  side,
  className,
}: {
  side: BracketSide
  className?: string
}) {
  const viewBox = `0 0 ${BRACKET_VIEWBOX.width} ${BRACKET_VIEWBOX.height}`
  const shapes = bracketCapsulesInViewBox(side).map((capsule) => (
    <path
      key={capsule.hue}
      d={capsulePath(capsule)}
      fill={HUE_FILL[capsule.hue]}
    />
  ))

  return (
    <span aria-hidden="true" className={cn('bracket-poster', className)}>
      <svg viewBox={viewBox} focusable="false" className="bracket-poster-tint">
        {shapes}
      </svg>
      <svg viewBox={viewBox} focusable="false" className="bracket-poster-dots">
        {shapes}
      </svg>
    </span>
  )
}
