import { Suspense, ViewTransition, type ReactNode } from 'react'

/**
 * A Suspense boundary whose loading handoff animates: the skeleton slides
 * down and out, then the content slides up and in (site-content.css
 * `.reveal-exit` / `.reveal-enter`). `default="none"` keeps both still during
 * unrelated transitions such as route slides.
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
