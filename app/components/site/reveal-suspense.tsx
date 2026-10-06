import { Suspense, ViewTransition, type ReactNode } from 'react'

/** default="none"으로 페이지 이동 중에는 움직이지 않고, Suspense 콘텐츠가 나타날 때만 전환한다. */
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
