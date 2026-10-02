'use client'

/**
 * 프로그램 카드 묶음의 높이 보정(클라이언트 컴포넌트).
 */
import { useEffect, useRef, type ReactNode } from 'react'

/**
 * 프로그램 목록. 각 카드의 실제 높이를 `--card-h`에 넣어, site-home.css의 sticky 오프셋이 자리 아래로
 * 넘치는 카드를 아래쪽이 화면 안에 남을 만큼만 위로 붙잡게 한다. 스크립트가 없으면 카드는 기본 자리에
 * 그대로 있다.
 */
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
