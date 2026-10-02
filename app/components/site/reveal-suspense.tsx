/**
 * 로딩 → 콘텐츠 전환을 애니메이션하는 Suspense 경계.
 */
import { Suspense, ViewTransition, type ReactNode } from 'react'

/**
 * 스켈레톤이 아래로 빠지고 콘텐츠가 위로 올라오며 나타나는 Suspense 경계
 * (`site-content.css`의 `.reveal-exit`/`.reveal-enter`). `default="none"`이라
 * 페이지 이동 같은 다른 전환 중에는 움직이지 않는다.
 * @param fallback 로딩 중 보여 줄 스켈레톤
 */
export default function RevealSuspense({
  fallback,
  children,
}: {
  fallback: ReactNode
  children: ReactNode
}) {
  return (
    <Suspense
      fallback={
        <ViewTransition exit="reveal-exit" default="none">
          {fallback}
        </ViewTransition>
      }
    >
      <ViewTransition enter="reveal-enter" default="none">
        {children}
      </ViewTransition>
    </Suspense>
  )
}
