/**
 * 세션 기록 데이터 가공(순수 함수): 제목·장소, 기수·월별 묶음, 필터, 검색, 관련 세션.
 */
import { pickLocalized, type Locale } from '@/lib/i18n'
import { sessionMonthKey } from '@/lib/format/datetime'
import { normalizeSearchText, type FacetOption } from '@/lib/site/filter-state'
import {
  SESSION_CATEGORIES,
  categoryLabel,
  isSessionCategory,
} from '@/lib/site/labels'

/** 세션 기록 쿼리가 돌려주는 공개 세션 하나(두 언어 필드 포함). */
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

/** 한 달의 세션 묶음. */
export type LogMonth = { key: string; sessions: LogSession[] }

/** 한 기수의 세션 묶음(월별). */
export type LogGeneration = {
  name: string
  startDate: string
  count: number
  months: LogMonth[]
}

/** 시작 시각이 없는 세션을 모으는 월 키(미정). */
export const TBA_MONTH = 'tba'

/** 현재 언어의 세션 제목(없으면 다른 언어). */
export function sessionTitle(
  session: Pick<LogSession, 'name' | 'nameKo'>,
  locale: Locale
): string {
  return pickLocalized(locale, { en: session.name, ko: session.nameKo }) ?? ''
}

/** 현재 언어의 세션 장소(없으면 다른 언어). */
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

/** 필터 선택지: 활동 분류, 파트, 기수와 각 개수. */
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

/** 검색 대상 문자열(두 언어 제목·장소, 파트, 기수). */
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

/** 일정이 있는 최신 세션(홈 화면 "최근 세션" 섹션). */
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

/**
 * 관련 세션(상세 페이지 하단). 점수가 낮을수록 가깝다:
 * 같은 파트·같은 기수 → 같은 파트 → 같은 분류. 같은 점수면 시간이 가까운 순.
 */
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
