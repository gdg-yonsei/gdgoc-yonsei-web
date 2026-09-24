import type { Locale } from '@/i18n-config'
import { sessionMonthKey } from '@/lib/site/datetime'
import { normalizeSearchText, type FacetOption } from '@/lib/site/filter-state'
import {
  SESSION_CATEGORIES,
  categoryLabel,
  isSessionCategory,
} from '@/lib/site/labels'

/** One public session as the archive read model returns it (bilingual). */
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

/** Month key for sessions without a start time. */
export const TBA_MONTH = 'tba'

export function sessionTitle(
  session: Pick<LogSession, 'name' | 'nameKo'>,
  locale: Locale
): string {
  return locale === 'ko'
    ? session.nameKo || session.name
    : session.name || session.nameKo
}

export function sessionLocation(
  session: Pick<LogSession, 'location' | 'locationKo'>,
  locale: Locale
): string | null {
  const [primary, fallback] =
    locale === 'ko'
      ? [session.locationKo, session.location]
      : [session.location, session.locationKo]
  return primary || fallback || null
}

function compareNewestFirst(a: LogSession, b: LogSession): number {
  if (a.startAt && b.startAt) return b.startAt.getTime() - a.startAt.getTime()
  if (a.startAt) return -1
  if (b.startAt) return 1
  return 0
}

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
        months.set(key, [...(months.get(key) ?? []), session])
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

function counts(values: readonly string[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const value of values) map.set(value, (map.get(value) ?? 0) + 1)
  return map
}

export function sessionFacets(
  sessions: readonly LogSession[],
  locale: Locale
): {
  categories: FacetOption[]
  parts: FacetOption[]
  generations: FacetOption[]
} {
  const categoryCounts = counts(sessions.map((session) => session.category))
  const categoryOrder = [
    ...SESSION_CATEGORIES.filter((category) => categoryCounts.has(category)),
    ...[...categoryCounts.keys()].filter((key) => !isSessionCategory(key)),
  ]
  const partCounts = counts(
    sessions.flatMap((session) => (session.partName ? [session.partName] : []))
  )

  return {
    categories: categoryOrder.map((value) => ({
      value,
      label: categoryLabel(value, locale),
      count: categoryCounts.get(value) ?? 0,
    })),
    parts: [...partCounts.entries()]
      .sort(([a, x], [b, y]) => y - x || a.localeCompare(b))
      .map(([value, count]) => ({ value, label: value, count })),
    generations: groupSessionLog(sessions).map((generation) => ({
      value: generation.name,
      label: generation.name,
      count: generation.count,
    })),
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

/** Chronological neighbours across the whole archive (undated sessions skip). */
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
