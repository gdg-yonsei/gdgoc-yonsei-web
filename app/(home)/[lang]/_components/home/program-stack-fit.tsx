'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/** 실제 카드 높이를 `--card-h`에 넣어, 큰 카드의 아래쪽도 화면 안에 남게 한다. JS가 없으면 기본 위치를 유지한다. */
export default function ProgramStackFit({ children }: { children: ReactNode }) {
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (!list || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height =
          entry.borderBoxSize?.[0]?.blockSize ??
          entry.target.getBoundingClientRect().height
        // 올림한다. 서브픽셀만큼 모자라도 화면 아래에 가는 선이 남는다.
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
