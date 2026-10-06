import { pickLocalized, type Locale } from '@/lib/i18n'
import { sessionMonthKey } from '@/lib/format/datetime'
import { normalizeSearchText, type FacetOption } from '@/lib/site/filter-state'
import {
  SESSION_CATEGORIES,
  categoryLabel,
  isSessionCategory,
} from '@/lib/site/labels'

export type LogSession = {
  id: string
  name: string
  nameKo: string
  category: string
  type: string | null
  mainImage: string
  startAt: Date | null
  endAt: Date | null
  location: string | null
  locationKo: string | null
  createdAt: Date
  updatedAt: Date
  partName: string | null
  generationName: string
  generationStartDate: string
}

export type LogMonth = { key: string; sessions: LogSession[] }

export type LogGeneration = {
  name: string
  startDate: string
  count: number
  months: LogMonth[]
}

/** 시작 시각이 없는 세션을 모으는 월 키(미정). */
export const TBA_MONTH = 'tba'

export function sessionTitle(
  session: Pick<LogSession, 'name' | 'nameKo'>,
  locale: Locale
): string {
  return pickLocalized(locale, { en: session.name, ko: session.nameKo }) ?? ''
}

export function sessionLocation(
  session: Pick<LogSession, 'location' | 'locationKo'>,
  locale: Locale
): string | null {
  return pickLocalized(locale, { en: session.location, ko: session.locationKo })
}

function compareNewestFirst(a: LogSession, b: LogSession): number {
  if (a.startAt && b.startAt) return b.startAt.getTime() - a.startAt.getTime()
  if (a.startAt) return -1
  if (b.startAt) return 1
  return 0
}

/** 세션을 기수(최신순) → 월(최신순)로 묶는다. */
export function groupSessionLog(
  sessions: readonly LogSession[]
): LogGeneration[] {
  const generations = new Map<
    string,
    { startDate: string; sessions: LogSession[] }
  >()
  for (const session of sessions) {
    const entry = generations.get(session.generationName) ?? {
      startDate: session.generationStartDate,
      sessions: [],
    }
    entry.sessions.push(session)
    generations.set(session.generationName, entry)
  }

  return [...generations.entries()]
    .sort(([, a], [, b]) => b.startDate.localeCompare(a.startDate))
    .map(([name, { startDate, sessions: own }]) => {
      const months = new Map<string, LogSession[]>()
      for (const session of [...own].sort(compareNewestFirst)) {
        const key = session.startAt
          ? sessionMonthKey(session.startAt)
          : TBA_MONTH
        const month = months.get(key) ?? []
        month.push(session)
        months.set(key, month)
      }
      return {
        name,
        startDate,
        count: own.length,
        months: [...months.entries()].map(([key, list]) => ({
          key,
          sessions: list,
        })),
      }
    })
}

export function sessionFacets(
  sessions: readonly LogSession[],
  locale: Locale
): {
  categories: FacetOption[]
  parts: FacetOption[]
  generations: FacetOption[]
} {
  const categoryCounts = new Map<string, number>()
  const partCounts = new Map<string, number>()
  const generations = new Map<string, { startDate: string; count: number }>()
  for (const session of sessions) {
    categoryCounts.set(
      session.category,
      (categoryCounts.get(session.category) ?? 0) + 1
    )
    if (session.partName) {
      partCounts.set(
        session.partName,
        (partCounts.get(session.partName) ?? 0) + 1
      )
    }
    const generation = generations.get(session.generationName) ?? {
      startDate: session.generationStartDate,
      count: 0,
    }
    generation.count += 1
    generations.set(session.generationName, generation)
  }
  const categoryOrder = [
    ...SESSION_CATEGORIES.filter((category) => categoryCounts.has(category)),
    ...[...categoryCounts.keys()].filter((key) => !isSessionCategory(key)),
  ]

  return {
    categories: categoryOrder.map((value) => ({
      value,
      label: categoryLabel(value, locale),
      count: categoryCounts.get(value) ?? 0,
    })),
    parts: [...partCounts.entries()]
      .sort(([a, x], [b, y]) => y - x || a.localeCompare(b))
      .map(([value, count]) => ({ value, label: value, count })),
    generations: [...generations.entries()]
      .sort(([, a], [, b]) => b.startDate.localeCompare(a.startDate))
      .map(([value, { count }]) => ({ value, label: value, count })),
  }
}

export function sessionSearchText(session: LogSession): string {
  return normalizeSearchText(
    [
      session.name,
      session.nameKo,
      session.partName,
      session.location,
      session.locationKo,
      session.generationName,
      categoryLabel(session.category, 'en'),
      categoryLabel(session.category, 'ko'),
    ]
      .filter(Boolean)
      .join(' ')
  )
}

const startTime = (session: LogSession) => session.startAt?.getTime() ?? 0

export function latestSessions(
  sessions: readonly LogSession[],
  limit: number
): LogSession[] {
  return sessions
    .filter((session) => session.startAt)
    .sort((a, b) => startTime(b) - startTime(a))
    .slice(0, limit)
}

/** 전체 기록에서 시간순 이전·다음 세션(일정 없는 세션은 건너뛴다). */
export function adjacentSessions(
  sessions: readonly LogSession[],
  id: string
): { previous: LogSession | null; next: LogSession | null } {
  const dated = sessions
    .filter((session) => session.startAt)
    .sort((a, b) => startTime(a) - startTime(b))
  const index = dated.findIndex((session) => session.id === id)
  if (index === -1) return { previous: null, next: null }
  return { previous: dated[index - 1] ?? null, next: dated[index + 1] ?? null }
}

// 관련 세션은 같은 파트·기수, 같은 파트, 같은 분류 순이다. 동점이면 시각이 가까운 순이다.
export function relatedSessions(
  sessions: readonly LogSession[],
  current: LogSession,
  limit = 3
): LogSession[] {
  const score = (session: LogSession) => {
    if (session.partName && session.partName === current.partName) {
      return session.generationName === current.generationName ? 0 : 1
    }
    return session.category === current.category ? 2 : 3
  }
  const time = startTime(current)

  return sessions
    .filter((session) => session.id !== current.id && score(session) < 3)
    .sort(
      (a, b) =>
        score(a) - score(b) ||
        Math.abs(startTime(a) - time) - Math.abs(startTime(b) - time)
    )
    .slice(0, limit)
}
