/**
 * 캡슐 모양 링크 버튼과 그 클래스 헬퍼. 캡슐 모양은 GDG 마크의 획을 따른 것이다.
 */
import Link from 'next/link'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

/** 버튼 색 조합. `stage*`는 어두운 무대 배경 위에서 쓴다. */
const tones = {
  solid: 'bg-fg text-paper hover:bg-fg/85',
  outline: 'border border-rule bg-sheet text-fg hover:border-fg-subtle',
  stageSolid: 'bg-on-stage text-stage hover:bg-white',
  stageOutline:
    'border border-white/20 text-on-stage hover:border-white/40 hover:bg-white/5',
} as const

/** 버튼 색 조합 이름. */
export type ButtonTone = keyof typeof tones

/** 모든 캡슐 버튼에 공통인 클래스. */
const BASE =
  'pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold'

/** 캡슐 버튼 클래스 문자열. `next/link`가 아닌 `<a>`(외부 링크 등)에 쓴다. */
export function buttonClasses(tone: ButtonTone = 'solid') {
  return `${BASE} ${tones[tone]}`
}

/**
 * 캡슐 모양 행동 유도 링크. `next/link`의 props를 그대로 받는다.
 * @param tone 색 조합(기본 `solid`)
 */
export default function ButtonLink({
  tone = 'solid',
  className,
  ...props
}: ComponentProps<typeof Link> & { tone?: ButtonTone }) {
  return <Link {...props} className={cn(BASE, tones[tone], className)} />
}
