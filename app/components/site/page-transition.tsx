import { ViewTransition, type ReactNode } from 'react'

/** 전환 종류가 없는 뒤로 가기·새로 고침에는 애니메이션을 적용하지 않는다. */
export const PAGE_TRANSITIONS = {
  'nav-forward': 'nav-forward',
  'nav-back': 'nav-back',
  'generation-switch': 'crossfade',
  default: 'none',
} as const

/** 이동해도 레이아웃이 유지되므로, 각 페이지가 전환 래퍼를 직접 둔다. */
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
