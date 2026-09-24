import type { ReactNode } from 'react'
import type { Hue } from '@/lib/site/labels'

export default function Chip({
  hue = 'neutral',
  children,
}: {
  hue?: Hue
  children: ReactNode
}) {
  return (
    <span className="site-chip" data-hue={hue}>
      {children}
    </span>
  )
}
