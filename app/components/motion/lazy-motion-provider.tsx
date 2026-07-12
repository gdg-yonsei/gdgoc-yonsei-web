'use client'

import { LazyMotion, domAnimation } from 'motion/react'
import type { ReactNode } from 'react'

/** m.* 컴포넌트용 전역 LazyMotion 컨텍스트 (domAnimation 서브셋) */
export default function LazyMotionProvider({
  children,
}: {
  children: ReactNode
}) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>
}
