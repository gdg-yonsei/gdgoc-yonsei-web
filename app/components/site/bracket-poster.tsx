/**
 * GDG 괄호 마크를 망점 인쇄물처럼 그리는 장식 그래픽(서버 컴포넌트). 홈 히어로와 프로젝트 기본 이미지에 쓴다.
 */
import {
  BRACKET_VIEWBOX,
  bracketCapsulesInViewBox,
  capsulePath,
  type BracketSide,
} from '@/lib/site/bracket-geometry'
import { CAPSULE_HEX } from '@/lib/site/brand'
import { cn } from '@/lib/cn'

/**
 * GDG 괄호 하나를 망점 인쇄처럼 그린다. 옅은 단색 바탕 위에, 같은 캡슐 모양을 CSS
 * 마스크로 점 격자만 남겨 겹친다. 서버에서 렌더링하므로 JS 없이 히어로가 그려진다.
 *
 * SVG `<pattern>` 채우기를 일부러 쓰지 않는다. 마크가 약 150px보다 커지면 Chromium이
 * 패턴을 화면 폭 전체의 흰 띠로 래스터화하는 문제가 있었다.
 * @param side 왼쪽(`left`) 또는 오른쪽(`right`) 괄호
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
