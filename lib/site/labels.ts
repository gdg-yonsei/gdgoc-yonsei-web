/**
 * 세션 분류·파트 이름의 표시 이름과 색(순수 함수).
 */
import type { Locale } from '@/lib/i18n'

/** 배지 색상 이름. */
export type Hue =
  'blue' | 'sky' | 'red' | 'pink' | 'yellow' | 'green' | 'neutral'

/** 활동 분류. 순서는 `db/schema/sessions.ts`의 `activityCategoryEnum`과 같다. */
export const SESSION_CATEGORIES = [
  'tech_talk',
  'part_session',
  'hackathon',
  'demo_day',
  'devrel',
] as const

/** 활동 분류 유니온. */
export type SessionCategory = (typeof SESSION_CATEGORIES)[number]

const CATEGORY_LABELS: Record<SessionCategory, Record<Locale, string>> = {
  tech_talk: { en: 'Tech Talk', ko: '기술 세션' },
  part_session: { en: 'Part Session', ko: '파트 세션' },
  hackathon: { en: 'Hackathon', ko: '해커톤' },
  demo_day: { en: 'Demo Day', ko: '데모데이' },
  devrel: { en: 'Community Event', ko: '커뮤니티 행사' },
}

const CATEGORY_HUES: Record<SessionCategory, Hue> = {
  tech_talk: 'blue',
  part_session: 'green',
  hackathon: 'red',
  demo_day: 'yellow',
  devrel: 'pink',
}

/** 문자열이 알려진 활동 분류인지. */
export function isSessionCategory(value: string): value is SessionCategory {
  return (SESSION_CATEGORIES as readonly string[]).includes(value)
}

/** 활동 분류의 표시 이름(언어별). */
export function categoryLabel(category: string, locale: Locale): string {
  return isSessionCategory(category)
    ? CATEGORY_LABELS[category][locale]
    : category
}

/** 활동 분류의 배지 색. */
export function categoryHue(category: string): Hue {
  return isSessionCategory(category) ? CATEGORY_HUES[category] : 'neutral'
}

/* 파트 이름은 기수마다 자유롭게 정하는 텍스트다("Front-End", "UI/UX" 등). 이름으로 색을 정한다. */
const PART_HUES: ReadonlyArray<readonly [RegExp, Hue]> = [
  [/front/, 'blue'],
  [/back/, 'green'],
  [/\bml\b|\bai\b|data/, 'yellow'],
  [/cloud|infra/, 'sky'],
  [/\bui\b|\bux\b|design/, 'pink'],
  [/devrel|community/, 'red'],
]

/** 파트 이름의 배지 색. 알 수 없는 이름도 항상 같은 색이 나오도록 이름에서 계산한다. */
export function partHue(partName: string | null | undefined): Hue {
  const key = (partName ?? '').toLowerCase()
  return PART_HUES.find(([pattern]) => pattern.test(key))?.[1] ?? 'neutral'
}
