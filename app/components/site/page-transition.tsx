/**
 * 페이지 전환 애니메이션 래퍼(React `ViewTransition`).
 */
import { ViewTransition, type ReactNode } from 'react'

/**
 * 링크가 붙일 수 있는 전환 종류와 각각의 애니메이션 클래스(`site-content.css`).
 * 종류가 없는 이동(브라우저 뒤로 가기, 새로 고침)은 애니메이션 없이 바뀐다.
 */
export const PAGE_TRANSITIONS = {
  'nav-forward': 'nav-forward',
  'nav-back': 'nav-back',
  'generation-switch': 'crossfade',
  default: 'none',
} as const

/**
 * `nav-forward`/`nav-back` 링크에서는 본문을 좌우로 밀고, 같은 페이지의 기수 전환에서는
 * 크로스페이드한다. 레이아웃은 이동해도 유지되므로 각 페이지가 스스로 감싸야 한다.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={PAGE_TRANSITIONS}
      exit={PAGE_TRANSITIONS}
      default="none"
    >
      {children}
    </ViewTransition>
  )
}
