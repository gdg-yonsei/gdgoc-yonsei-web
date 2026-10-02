/**
 * 분류 라벨 칩. 색은 `data-hue`로 CSS가 정한다.
 */
import type { ReactNode } from 'react'
import type { Hue } from '@/lib/site/labels'

/**
 * 작은 라벨 칩.
 *
 * @param hue 브랜드 색 이름(`lib/site/labels`의 `Hue`, 기본 `neutral`)
 */
export default function Chip({
  hue = 'neutral',
  children,
}: {
  hue?: Hue
  children: ReactNode
}) {
  return (
    <span className="site-chip" data-hue={hue}>
      {children}
    </span>
  )
}
