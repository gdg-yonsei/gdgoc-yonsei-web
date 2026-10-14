/** Web Vitals 보고서. Google 평가와 같이 75번째 백분위(p75)를 대표값으로 쓴다. */
import 'server-only'

import { sql, type SQL } from 'drizzle-orm'
import type { TimeBucket } from '@/lib/analytics/date-range'
import { WEB_VITAL_NAMES, type WebVitalName } from '@/lib/analytics/events'
import type { AnalyticsFilter } from '@/lib/analytics/filters'
import {
  bucketSql,
  pageConditions,
  selectRows,
  sessionConditions,
  timestampParam,
  whereAll,
  type QueryExecutor,
} from '@/lib/server/analytics/queries/sql'

export type VitalSummary = {
  metric: WebVitalName
  p75: number | null
  good: number
  needsImprovement: number
  poor: number
  samples: number
}

export type WebVitalsReport = {
  summary: VitalSummary[]
  series: Array<{ bucket: string; metric: WebVitalName; p75: number }>
  byDevice: Array<{
    deviceType: string
    metric: WebVitalName
    p75: number
    samples: number
  }>
  slowestPages: Array<{
    path: string
    metric: WebVitalName
    p75: number
    samples: number
  }>
}

// 표본이 너무 적은 페이지는 순위를 왜곡하므로 뺀다.
const MIN_PAGE_SAMPLES = 5

function vitalEvents(input: {
  filter: AnalyticsFilter
  start: Date
  end: Date
}): SQL {
  return sql`
    ve AS (
      SELECT e.metric, e.value, e.rating, e.path, s."deviceType", e."occurredAt"
      FROM analytics_events e
      JOIN analytics_sessions s ON s.id = e."sessionId"
      JOIN analytics_page_views v ON v.id = e."pageViewId"
      WHERE e.name = 'web_vital'
        AND e."occurredAt" >= ${timestampParam(input.start)}
        AND e."occurredAt" < ${timestampParam(input.end)}
        AND ${whereAll([...sessionConditions(input.filter, 's'), ...pageConditions(input.filter, 'v')])}
    )`
}

const P75 = sql`percentile_cont(0.75) WITHIN GROUP (ORDER BY ve.value)::float8`

export async function getWebVitals(
  executor: QueryExecutor,
  input: { filter: AnalyticsFilter; start: Date; end: Date; bucket: TimeBucket }
): Promise<WebVitalsReport> {
  const summaryRows = await selectRows<{
    metric: WebVitalName
    p75: number
    good: number
    ni: number
    poor: number
    samples: number
  }>(
    executor,
    sql`
      WITH ${vitalEvents(input)}
      SELECT ve.metric, ${P75} AS p75,
        count(*) FILTER (WHERE ve.rating = 'good')::int AS good,
        count(*) FILTER (WHERE ve.rating = 'needs-improvement')::int AS ni,
        count(*) FILTER (WHERE ve.rating = 'poor')::int AS poor,
        count(*)::int AS samples
      FROM ve GROUP BY ve.metric
    `
  )
  const series = await selectRows<{
    bucket: string
    metric: WebVitalName
    p75: number
  }>(
    executor,
    sql`
      WITH ${vitalEvents(input)}
      SELECT ${bucketSql(sql`ve."occurredAt"`, input.bucket)} AS bucket, ve.metric, ${P75} AS p75
      FROM ve GROUP BY 1, 2 ORDER BY 1, 2
    `
  )
  const byDevice = await selectRows<{
    deviceType: string
    metric: WebVitalName
    p75: number
    samples: number
  }>(
    executor,
    sql`
      WITH ${vitalEvents(input)}
      SELECT ve."deviceType" AS "deviceType", ve.metric, ${P75} AS p75, count(*)::int AS samples
      FROM ve GROUP BY 1, 2 ORDER BY 1, 2
    `
  )
  const slowestPages = await selectRows<{
    path: string
    metric: WebVitalName
    p75: number
    samples: number
  }>(
    executor,
    sql`
      WITH ${vitalEvents(input)}
      SELECT ve.path, ve.metric, ${P75} AS p75, count(*)::int AS samples
      FROM ve WHERE ve.metric IN ('LCP', 'INP', 'CLS')
      GROUP BY 1, 2 HAVING count(*) >= ${MIN_PAGE_SAMPLES}
      ORDER BY p75 DESC LIMIT 20
    `
  )

  const byMetric = new Map(summaryRows.map((row) => [row.metric, row]))
  return {
    summary: WEB_VITAL_NAMES.map((metric) => {
      const row = byMetric.get(metric)
      return {
        metric,
        p75: row ? Number(row.p75) : null,
        good: Number(row?.good ?? 0),
        needsImprovement: Number(row?.ni ?? 0),
        poor: Number(row?.poor ?? 0),
        samples: Number(row?.samples ?? 0),
      }
    }),
    series: series.map((row) => ({ ...row, p75: Number(row.p75) })),
    byDevice: byDevice.map((row) => ({
      ...row,
      p75: Number(row.p75),
      samples: Number(row.samples),
    })),
    slowestPages: slowestPages.map((row) => ({
      ...row,
      p75: Number(row.p75),
      samples: Number(row.samples),
    })),
  }
}
