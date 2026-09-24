import type { Locale } from '@/i18n-config'

export type Hue =
  'blue' | 'sky' | 'red' | 'pink' | 'yellow' | 'green' | 'neutral'

/** Order matches `activityCategoryEnum` in db/schema/sessions.ts. */
export const SESSION_CATEGORIES = [
  'tech_talk',
  'part_session',
  'hackathon',
  'demo_day',
  'devrel',
] as const

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

export function isSessionCategory(value: string): value is SessionCategory {
  return (SESSION_CATEGORIES as readonly string[]).includes(value)
}

export function categoryLabel(category: string, locale: Locale): string {
  return isSessionCategory(category)
    ? CATEGORY_LABELS[category][locale]
    : category
}

export function categoryHue(category: string): Hue {
  return isSessionCategory(category) ? CATEGORY_HUES[category] : 'neutral'
}

/* Part names are free text per generation ("Front-End", "UI/UX" …). */
const PART_HUES: ReadonlyArray<readonly [RegExp, Hue]> = [
  [/front/, 'blue'],
  [/back/, 'green'],
  [/\bml\b|\bai\b|data/, 'yellow'],
  [/cloud|infra/, 'sky'],
  [/\bui\b|\bux\b|design/, 'pink'],
  [/devrel|community/, 'red'],
]

export function partHue(partName: string | null | undefined): Hue {
  const key = (partName ?? '').toLowerCase()
  return PART_HUES.find(([pattern]) => pattern.test(key))?.[1] ?? 'neutral'
}
