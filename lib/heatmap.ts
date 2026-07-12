export const ACTIVITY_CATEGORIES = [
  'tech_talk',
  'part_session',
  'hackathon',
  'demo_day',
  'devrel',
] as const

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number]

/** 동률 시 우선순위 (앞이 우선) */
export const CATEGORY_PRIORITY: readonly ActivityCategory[] = [
  'hackathon',
  'demo_day',
  'tech_talk',
  'part_session',
  'devrel',
]

/** 히트맵 셀·범례·인디케이터 색 (스펙 §5.1) */
export const CATEGORY_CELL_CLASS: Record<ActivityCategory, string> = {
  tech_talk: 'bg-gdg-blue-300',
  part_session: 'bg-gdg-green-300',
  hackathon: 'bg-gdg-red-300',
  demo_day: 'bg-yonsei-blue',
  devrel: 'bg-gdg-yellow-300',
}

export const CATEGORY_LABEL: Record<
  ActivityCategory,
  { en: string; ko: string }
> = {
  tech_talk: { en: 'Tech Talk', ko: '테크토크' },
  part_session: { en: 'Part Session', ko: '파트 세션' },
  hackathon: { en: 'Hackathon', ko: '해커톤' },
  demo_day: { en: 'Demo Day', ko: '데모데이' },
  devrel: { en: 'DevRel · Social', ko: 'DevRel · 소셜' },
}

export const HEATMAP_WEEKS = 52

const DAY_MS = 24 * 60 * 60 * 1000
export const WEEK_MS = 7 * DAY_MS

export type HeatmapSessionInput = {
  id: string
  name: string
  nameKo: string
  /** ISO datetime string (UTC) */
  startAt: string
  category: ActivityCategory
  participantCount: number
}

export type HeatmapWeek = {
  /** 주 시작 월요일(UTC), YYYY-MM-DD */
  weekKey: string
  weekStartIso: string
  count: number
  dominantCategory: ActivityCategory | null
  sessions: HeatmapSessionInput[]
}

/** 해당 시각이 속한 주의 월요일 00:00(UTC) */
export function startOfWeekUtc(date: Date): Date {
  const day = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )
  const weekdayOffset = (day.getUTCDay() + 6) % 7 // Mon=0 ... Sun=6
  return new Date(day.getTime() - weekdayOffset * DAY_MS)
}

function toWeekKey(weekStart: Date): string {
  return weekStart.toISOString().slice(0, 10)
}

export function dominantCategoryOf(
  sessions: readonly HeatmapSessionInput[]
): ActivityCategory | null {
  if (sessions.length === 0) {
    return null
  }

  const counts = new Map<ActivityCategory, number>()
  for (const session of sessions) {
    counts.set(session.category, (counts.get(session.category) ?? 0) + 1)
  }

  let best: ActivityCategory = CATEGORY_PRIORITY[0]!
  let bestCount = 0
  for (const category of CATEGORY_PRIORITY) {
    const count = counts.get(category) ?? 0
    if (count > bestCount) {
      best = category
      bestCount = count
    }
  }

  return bestCount > 0 ? best : null
}

export function buildHeatmapWeeks(
  sessions: readonly HeatmapSessionInput[],
  reference: Date
): HeatmapWeek[] {
  const currentWeekStart = startOfWeekUtc(reference)

  const buckets = new Map<string, HeatmapSessionInput[]>()
  for (const session of sessions) {
    const weekKey = toWeekKey(startOfWeekUtc(new Date(session.startAt)))
    const bucket = buckets.get(weekKey)
    if (bucket) {
      bucket.push(session)
    } else {
      buckets.set(weekKey, [session])
    }
  }

  const weeks: HeatmapWeek[] = []
  for (let index = HEATMAP_WEEKS - 1; index >= 0; index -= 1) {
    const weekStart = new Date(currentWeekStart.getTime() - index * WEEK_MS)
    const weekKey = toWeekKey(weekStart)
    const bucketSessions = buckets.get(weekKey) ?? []
    weeks.push({
      weekKey,
      weekStartIso: weekStart.toISOString(),
      count: bucketSessions.length,
      dominantCategory: dominantCategoryOf(bucketSessions),
      sessions: bucketSessions,
    })
  }

  return weeks
}

/** 주당 활동 수 → 셀 opacity (스펙 §8) */
export function intensityOpacity(count: number): number {
  if (count <= 0) {
    return 1
  }
  if (count === 1) {
    return 0.45
  }
  if (count === 2) {
    return 0.7
  }
  return 1
}
