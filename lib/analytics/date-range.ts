/**
 * 보고서 기간을 서울 날짜 경계로 계산한다. 서울은 일광 절약 시간이 없어 UTC+9 고정 오프셋으로 충분하다.
 * 끝은 포함하지 않는다(`[start, end)`). 직전 기간은 같은 길이로 바로 앞이다.
 */
import { RETENTION_MONTHS } from '@/lib/analytics/constants'
import type { AnalyticsFilter } from '@/lib/analytics/filters'

export type TimeBucket = 'hour' | 'day' | 'week'

export type DateRange = {
  start: Date
  end: Date
  previousStart: Date
  previousEnd: Date
  bucket: TimeBucket
  days: number
}

export const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

const PRESET_DAYS = {
  today: 1,
  '7d': 7,
  '28d': 28,
  '90d': 90,
  '12m': 365,
} as const

/** 서울 기준 그날 0시의 UTC 시각. */
function seoulDayStart(date: Date): number {
  return (
    Math.floor((date.getTime() + SEOUL_OFFSET_MS) / DAY_MS) * DAY_MS -
    SEOUL_OFFSET_MS
  )
}

function fromSeoulDate(value: string): number {
  return Date.parse(`${value}T00:00:00Z`) - SEOUL_OFFSET_MS
}

export function seoulDateString(date: Date): string {
  return new Date(date.getTime() + SEOUL_OFFSET_MS).toISOString().slice(0, 10)
}

// 차트 점 개수를 수십~백여 개로 유지한다.
function bucketFor(days: number): TimeBucket {
  if (days <= 2) return 'hour'
  if (days <= 120) return 'day'
  return 'week'
}

function build(start: number, end: number): DateRange {
  const length = end - start
  const days = Math.round(length / DAY_MS)
  return {
    start: new Date(start),
    end: new Date(end),
    previousStart: new Date(start - length),
    previousEnd: new Date(start),
    bucket: bucketFor(days),
    days,
  }
}

export function resolveDateRange(
  filter: Pick<AnalyticsFilter, 'range' | 'from' | 'to'>,
  now: Date
): DateRange {
  const tomorrow = seoulDayStart(now) + DAY_MS

  if (filter.range === 'yesterday')
    return build(tomorrow - 2 * DAY_MS, tomorrow - DAY_MS)
  if (filter.range === 'custom' && filter.from && filter.to) {
    const earliest = new Date(now.getTime())
    earliest.setUTCMonth(earliest.getUTCMonth() - RETENTION_MONTHS)
    const [first, last] = [
      fromSeoulDate(filter.from),
      fromSeoulDate(filter.to),
    ].sort((a, b) => a - b) as [number, number]
    const start = Math.max(first, seoulDayStart(earliest))
    const end = Math.min(last + DAY_MS, tomorrow)
    return build(start, Math.max(end, start + DAY_MS))
  }

  const days =
    filter.range === 'custom' ? PRESET_DAYS['28d'] : PRESET_DAYS[filter.range]
  return build(tomorrow - days * DAY_MS, tomorrow)
}

/** SQL `bucketSql`과 같은 형식의 구간 키 목록. 빈 구간을 0으로 채울 때 쓴다. */
export function bucketKeys(
  start: Date,
  end: Date,
  bucket: TimeBucket
): string[] {
  const keys: string[] = []
  if (bucket === 'hour') {
    for (let t = start.getTime(); t < end.getTime(); t += HOUR_MS) {
      keys.push(new Date(t + SEOUL_OFFSET_MS).toISOString().slice(0, 13))
    }
    return keys
  }
  if (bucket === 'day') {
    for (let t = start.getTime(); t < end.getTime(); t += DAY_MS)
      keys.push(seoulDateString(new Date(t)))
    return keys
  }
  // 주는 월요일에 시작한다(Postgres date_trunc('week')와 같다).
  const first = new Date(start.getTime() + SEOUL_OFFSET_MS)
  const mondayOffset = (first.getUTCDay() + 6) % 7
  for (
    let t = start.getTime() - mondayOffset * DAY_MS;
    t < end.getTime();
    t += 7 * DAY_MS
  ) {
    keys.push(seoulDateString(new Date(t)))
  }
  return keys
}
