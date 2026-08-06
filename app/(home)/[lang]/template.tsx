'use client'

import { m, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

/** 라우트 enter 페이드 (exit 애니메이션은 비범위 — 스펙 §10) */
export default function Template({ children }: { children: ReactNode }) {
  const shouldReduce = useReducedMotion()

  return (
    <m.div
      initial={shouldReduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </m.div>
  )
}
