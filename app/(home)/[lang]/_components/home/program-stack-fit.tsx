'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * The programs list. Each card's rendered height goes to `--card-h`, so the
 * sticky offset in site-home.css can hold a card that would not fit below
 * its slot just high enough to keep its bottom on screen. Without script the
 * cards keep their plain slots.
 */
export default function ProgramStackFit({
  children,
}: {
  children: ReactNode
}) {
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (!list || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height =
          entry.borderBoxSize?.[0]?.blockSize ??
          entry.target.getBoundingClientRect().height
        // Rounded up: a sub-pixel short would leave a hairline under the fold.
        ;(entry.target as HTMLElement).style.setProperty(
          '--card-h',
          `${Math.ceil(height)}px`
        )
      }
    })
    for (const card of list.children) observer.observe(card)

    return () => observer.disconnect()
  }, [])

  return (
    <ol ref={listRef} className="program-stack">
      {children}
    </ol>
  )
}
