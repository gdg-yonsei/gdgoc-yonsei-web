import {
  BRACKET_VIEWBOX,
  bracketCapsulesInViewBox,
  capsulePath,
  type BracketSide,
} from '@/lib/site/bracket-geometry'
import { CAPSULE_HEX } from '@/lib/site/brand'
import { cn } from '@/lib/cn'

/** 서버에서 CSS 마스크로 점 격자를 겹쳐 JS 없이 포스터를 그린다.
 * 약 150px보다 큰 SVG pattern을 Chromium이 흰 띠로 잘못 그릴 수 있어 쓰지 않는다. */
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
      fill={CAPSULE_HEX[capsule.hue]}
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
