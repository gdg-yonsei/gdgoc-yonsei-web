export type SeedCategory =
  | 'tech_talk'
  | 'part_session'
  | 'hackathon'
  | 'demo_day'
  | 'devrel'

export type SeedSessionPlan = {
  name: string
  nameKo: string
  category: SeedCategory
  startAt: Date
  endAt: Date
  location: string
  locationKo: string
}

export type DateRange = { from: Date; to: Date }

const DAY_MS = 24 * 60 * 60 * 1000

function isInRanges(date: Date, ranges: readonly DateRange[]): boolean {
  return ranges.some((range) => date >= range.from && date <= range.to)
}

/** from~to 사이 특정 요일(UTC)·시각의 반복 일정 생성 (skipRanges 제외) */
export function weeklyOccurrences(options: {
  from: Date
  to: Date
  /** 0=일 ... 6=토 (UTC) */
  weekday: number
  hourUtc: number
  stepWeeks?: number
  skipRanges?: readonly DateRange[]
}): Date[] {
  const { from, to, weekday, hourUtc, stepWeeks = 1, skipRanges = [] } = options

  const first = new Date(
    Date.UTC(
      from.getUTCFullYear(),
      from.getUTCMonth(),
      from.getUTCDate(),
      hourUtc
    )
  )
  while (first.getUTCDay() !== weekday) {
    first.setUTCDate(first.getUTCDate() + 1)
  }

  const dates: Date[] = []
  for (
    let cursor = new Date(first);
    cursor <= to;
    cursor = new Date(cursor.getTime() + stepWeeks * 7 * DAY_MS)
  ) {
    if (!isInRanges(cursor, skipRanges)) {
      dates.push(new Date(cursor))
    }
  }
  return dates
}

/** 시드 기수 활동 기간: 2025-09 ~ 2026-06 */
export const SEED_WINDOW = {
  from: new Date('2025-09-01T00:00:00.000Z'),
  to: new Date('2026-06-30T23:59:59.000Z'),
}

/** 방학·시험 공백 (히트맵 밀도가 현실적으로 보이도록) */
export const SEED_BREAKS: readonly DateRange[] = [
  {
    from: new Date('2025-12-15T00:00:00.000Z'),
    to: new Date('2026-01-05T23:59:59.000Z'),
  },
  {
    from: new Date('2026-02-09T00:00:00.000Z'),
    to: new Date('2026-03-01T23:59:59.000Z'),
  },
]

function twoHourSlot(start: Date): { startAt: Date; endAt: Date } {
  return {
    startAt: start,
    endAt: new Date(start.getTime() + 2 * 60 * 60 * 1000),
  }
}

export function buildSessionPlans(): SeedSessionPlan[] {
  const plans: SeedSessionPlan[] = []

  // 매주 화요일 19:00 KST (10:00 UTC) — T19
  weeklyOccurrences({
    ...SEED_WINDOW,
    weekday: 2,
    hourUtc: 10,
    skipRanges: SEED_BREAKS,
  }).forEach((date, index) => {
    plans.push({
      name: `T19 Week ${index + 1}`,
      nameKo: `T19 ${index + 1}주차`,
      category: 'tech_talk',
      ...twoHourSlot(date),
      location: 'Engineering Hall B039',
      locationKo: '공학원 B039',
    })
  })

  // 격주 목요일 — 파트 세션
  weeklyOccurrences({
    ...SEED_WINDOW,
    weekday: 4,
    hourUtc: 10,
    stepWeeks: 2,
    skipRanges: SEED_BREAKS,
  }).forEach((date, index) => {
    plans.push({
      name: `Part Session ${index + 1}`,
      nameKo: `파트 세션 ${index + 1}회`,
      category: 'part_session',
      ...twoHourSlot(date),
      location: 'Yonsei-Samsung Library',
      locationKo: '연세삼성학술정보관',
    })
  })

  const specials: Array<
    Omit<SeedSessionPlan, 'startAt' | 'endAt'> & { dateIso: string }
  > = [
    { name: 'Namu-thon', nameKo: '나무톤', category: 'hackathon', dateIso: '2025-11-08T01:00:00.000Z', location: 'Baekyang Nuri', locationKo: '백양누리' },
    { name: 'The Bridge Hackathon', nameKo: '브릿지 해커톤', category: 'hackathon', dateIso: '2026-02-21T01:00:00.000Z', location: 'Seoul & Tokyo', locationKo: '서울·도쿄' },
    { name: 'oTP Demo Day', nameKo: 'oTP 데모데이', category: 'demo_day', dateIso: '2025-12-12T09:00:00.000Z', location: 'Engineering Hall Auditorium', locationKo: '공학원 대강당' },
    { name: 'Yonsei X Korea Demo Day', nameKo: '연세 X 고려 데모데이', category: 'demo_day', dateIso: '2026-05-30T05:00:00.000Z', location: 'Korea University', locationKo: '고려대학교' },
    { name: 'Welcome Networking Night', nameKo: '웰컴 네트워킹 나이트', category: 'devrel', dateIso: '2025-09-19T09:00:00.000Z', location: 'Sinchon', locationKo: '신촌' },
    { name: 'DevRel Insight Night', nameKo: 'DevRel 인사이트 나이트', category: 'devrel', dateIso: '2025-10-31T09:00:00.000Z', location: 'Student Union', locationKo: '학생회관' },
    { name: 'Alumni Career Talk', nameKo: '알럼나이 커리어 토크', category: 'devrel', dateIso: '2026-03-27T09:00:00.000Z', location: 'Online', locationKo: '온라인' },
    { name: 'Google I/O Watch Party', nameKo: '구글 I/O 워치 파티', category: 'devrel', dateIso: '2026-05-08T09:00:00.000Z', location: 'Engineering Hall B039', locationKo: '공학원 B039' },
  ]
  for (const special of specials) {
    plans.push({
      name: special.name,
      nameKo: special.nameKo,
      category: special.category,
      ...twoHourSlot(new Date(special.dateIso)),
      location: special.location,
      locationKo: special.locationKo,
    })
  }

  return plans.sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
}
