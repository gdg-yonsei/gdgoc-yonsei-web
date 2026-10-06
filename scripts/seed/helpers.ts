export type SeedCategory =
  'tech_talk' | 'part_session' | 'hackathon' | 'demo_day' | 'devrel'

export type SeedSessionPlan = {
  name: string
  nameKo: string
  category: SeedCategory
  startAt: Date
  endAt: Date
  location: string
  locationKo: string
}

/** 기간(양 끝 포함). */
export type DateRange = { from: Date; to: Date }

const DAY_MS = 24 * 60 * 60 * 1000

function isInRanges(date: Date, ranges: readonly DateRange[]): boolean {
  return ranges.some((range) => date >= range.from && date <= range.to)
}

// 서울 벽시계 hour를 그대로 UTC 라벨로 저장한다. 예: 서울 화요일 19시는 T19:00:00.000Z다.
export function weeklyOccurrences(options: {
  from: Date
  to: Date
  /** 0=일 ... 6=토 */
  weekday: number
  /** 서울 벽시계 시각(시) */
  hour: number
  stepWeeks?: number
  skipRanges?: readonly DateRange[]
}): Date[] {
  const { from, to, weekday, hour, stepWeeks = 1, skipRanges = [] } = options

  const first = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), hour)
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

  // T19는 매주 화요일 서울 19시다.
  weeklyOccurrences({
    ...SEED_WINDOW,
    weekday: 2,
    hour: 19,
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

  // 파트 세션은 격주 목요일 서울 19시다.
  weeklyOccurrences({
    ...SEED_WINDOW,
    weekday: 4,
    hour: 19,
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

  // 특별 행사. dateIso도 서울 벽시계 시각을 UTC 라벨로 적는다(예: 오후 7시 → T19:00Z).
  const specials: Array<
    Omit<SeedSessionPlan, 'startAt' | 'endAt'> & { dateIso: string }
  > = [
    {
      name: 'Namu-thon',
      nameKo: '나무톤',
      category: 'hackathon',
      dateIso: '2025-11-08T10:00:00.000Z',
      location: 'Baekyang Nuri',
      locationKo: '백양누리',
    },
    {
      name: 'The Bridge Hackathon',
      nameKo: '브릿지 해커톤',
      category: 'hackathon',
      dateIso: '2026-02-21T10:00:00.000Z',
      location: 'Seoul & Tokyo',
      locationKo: '서울·도쿄',
    },
    {
      name: 'oTP Demo Day',
      nameKo: 'oTP 데모데이',
      category: 'demo_day',
      dateIso: '2025-12-12T18:00:00.000Z',
      location: 'Engineering Hall Auditorium',
      locationKo: '공학원 대강당',
    },
    {
      name: 'Yonsei X Korea Demo Day',
      nameKo: '연세 X 고려 데모데이',
      category: 'demo_day',
      dateIso: '2026-05-30T14:00:00.000Z',
      location: 'Korea University',
      locationKo: '고려대학교',
    },
    {
      name: 'Welcome Networking Night',
      nameKo: '웰컴 네트워킹 나이트',
      category: 'devrel',
      dateIso: '2025-09-19T18:00:00.000Z',
      location: 'Sinchon',
      locationKo: '신촌',
    },
    {
      name: 'DevRel Insight Night',
      nameKo: 'DevRel 인사이트 나이트',
      category: 'devrel',
      dateIso: '2025-10-31T18:00:00.000Z',
      location: 'Student Union',
      locationKo: '학생회관',
    },
    {
      name: 'Alumni Career Talk',
      nameKo: '알럼나이 커리어 토크',
      category: 'devrel',
      dateIso: '2026-03-27T18:00:00.000Z',
      location: 'Online',
      locationKo: '온라인',
    },
    {
      name: 'Google I/O Watch Party',
      nameKo: '구글 I/O 워치 파티',
      category: 'devrel',
      dateIso: '2026-05-08T18:00:00.000Z',
      location: 'Engineering Hall B039',
      locationKo: '공학원 B039',
    },
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
