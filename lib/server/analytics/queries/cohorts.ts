/**
 * 주간 리텐션. 방문자의 첫 세션 주(서울 월요일 시작)가 코호트이고, n주 차 비율은 그 주에 다시 온 방문자 비율이다.
 * 첫 세션은 기간과 무관하게 전체 기록에서 찾는다(기간 시작 전에 처음 온 사람을 신규로 잘못 세지 않게).
 */
import 'server-only'

import { sql } from 'drizzle-orm'
import type { AnalyticsFilter } from '@/lib/analytics/filters'
import {
  selectRows,
  sessionConditions,
  timestampParam,
  whereAll,
  type QueryExecutor,
} from '@/lib/server/analytics/queries/sql'

export type CohortRow = { cohort: string; size: number; rates: number[] }

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export async function getRetention(
  executor: QueryExecutor,
  input: { filter: AnalyticsFilter; end: Date; weeks?: number }
): Promise<CohortRow[]> {
  const weeks = input.weeks ?? 12
  const since = new Date(input.end.getTime() - weeks * WEEK_MS)
  const conditions = whereAll(
    sessionConditions({ ...input.filter, visitor: null }, 's')
  )

  const rows = await selectRows<{
    cohort: string
    week: number
    visitors: number
  }>(
    executor,
    sql`
      WITH visits AS (
        SELECT s."visitorId", date_trunc('week', s."startedAt" + interval '9 hours') AS week
        FROM analytics_sessions s
        WHERE s."startedAt" < ${timestampParam(input.end)} AND ${conditions}
        GROUP BY 1, 2
      ),
      firsts AS (
        SELECT "visitorId", min(week) AS cohort FROM visits GROUP BY 1
      )
      SELECT to_char(f.cohort, 'YYYY-MM-DD') AS cohort,
        (extract(epoch from (v.week - f.cohort)) / 604800)::int AS week,
        count(DISTINCT v."visitorId")::int AS visitors
      FROM firsts f JOIN visits v ON v."visitorId" = f."visitorId"
      WHERE f.cohort >= date_trunc('week', ${timestampParam(since)} + interval '9 hours')
      GROUP BY 1, 2 ORDER BY 1, 2
    `
  )

  const cohorts = new Map<string, Map<number, number>>()
  for (const row of rows) {
    const weeksOf = cohorts.get(row.cohort) ?? new Map<number, number>()
    weeksOf.set(Number(row.week), Number(row.visitors))
    cohorts.set(row.cohort, weeksOf)
  }

  const endWeekMs = input.end.getTime()
  return [...cohorts.entries()].map(([cohort, byWeek]) => {
    const size = byWeek.get(0) ?? 0
    // 아직 끝나지 않은 주는 비율에 넣지 않는다.
    const elapsed = Math.floor(
      (endWeekMs - (Date.parse(`${cohort}T00:00:00Z`) - 9 * 3600 * 1000)) /
        WEEK_MS
    )
    const rates = Array.from(
      { length: Math.max(1, Math.min(elapsed, weeks)) },
      (_, week) => (size > 0 ? (byWeek.get(week) ?? 0) / size : 0)
    )
    return { cohort, size, rates }
  })
}
