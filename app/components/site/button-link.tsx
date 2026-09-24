import Link from 'next/link'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

const tones = {
  solid: 'bg-fg text-paper hover:bg-fg/85',
  outline: 'border border-rule bg-sheet text-fg hover:border-fg-subtle',
  stageSolid: 'bg-on-stage text-stage hover:bg-white',
  stageOutline:
    'border border-white/20 text-on-stage hover:border-white/40 hover:bg-white/5',
} as const

export type ButtonTone = keyof typeof tones

const BASE =
  'pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold'

/** Class names of a capsule button, for anchors that aren't next/link. */
export function buttonClasses(tone: ButtonTone = 'solid') {
  return `${BASE} ${tones[tone]}`
}

/** Capsule-shaped call to action; the capsule echoes the GDG mark strokes. */
export default function ButtonLink({
  tone = 'solid',
  className,
  ...props
}: ComponentProps<typeof Link> & { tone?: ButtonTone }) {
  return <Link {...props} className={cn(BASE, tones[tone], className)} />
}
