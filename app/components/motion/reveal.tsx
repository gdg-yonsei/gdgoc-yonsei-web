'use client'

import { m, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

/** 표준 스크롤 리빌 래퍼: opacity 0→1 + y 8px→0, 1회 실행 */
export default function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const shouldReduce = useReducedMotion()

  return (
    <m.div
      className={className}
      initial={shouldReduce ? false : { opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      {children}
    </m.div>
  )
}
