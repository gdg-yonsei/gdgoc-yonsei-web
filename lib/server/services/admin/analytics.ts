/**
 * 분석 화면·CSV·MCP가 공유하는 읽기 서비스. 권한(get analyticsPage)을 확인하고 한 트랜잭션 안에서 쿼리를 묶는다.
 * 시간 초과(57014)는 기간을 줄이라는 실패로, 그 밖의 예외는 로그를 남기고 INTERNAL로 바꾼다.
 */
import 'server-only'

import {
  bucketKeys,
  resolveDateRange,
  type DateRange,
} from '@/lib/analytics/date-range'
import type {
  AnalyticsFilter,
  SearchParamsRecord,
} from '@/lib/analytics/filters'
import {
  EMPTY_SESSION_METRICS,
  SESSION_METRIC_KEYS,
  deriveSessionMetrics,
  type DerivedSessionMetrics,
  type SessionMetricKey,
} from '@/lib/analytics/metrics'
import {
  getRetention,
  type CohortRow,
} from '@/lib/server/analytics/queries/cohorts'
import {
  getEvents,
  getNotFound,
  getPageDetail,
  getPages,
  type EventRow,
  type NotFoundRow,
  type PageDetail,
  type PageRow,
} from '@/lib/server/analytics/queries/pages'
import {
  getRealtime,
  type RealtimeSnapshot,
} from '@/lib/server/analytics/queries/realtime'
import {
  SESSION_DIMENSIONS,
  aggregateSessions,
  collectingSince,
  type SessionDimension,
  type SessionMetricRow,
} from '@/lib/server/analytics/queries/sessions'
import {
  isQueryTimeout,
  withAnalyticsTimeout,
  type QueryExecutor,
} from '@/lib/server/analytics/queries/sql'
import {
  getWebVitals,
  type WebVitalsReport,
} from '@/lib/server/analytics/queries/vitals'
import { logger } from '@/lib/server/logger'
import { authorize } from '@/lib/server/services/admin/authorize'
import {
  fail,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'
import { ANALYTICS_TIMEOUT_MESSAGE } from '@/lib/analytics/messages'

export type SeriesPoint = { bucket: string } & DerivedSessionMetrics
type Named = { name: string } & DerivedSessionMetrics

async function runAnalyticsRead<T>(
  actor: Actor,
  scope: string,
  work: (tx: QueryExecutor) => Promise<T>
): Promise<ServiceResult<T>> {
  const authorization = authorize(actor, 'get', 'analyticsPage')
  if (!authorization.ok) return authorization
  try {
    return ok(await withAnalyticsTimeout(work))
  } catch (error) {
    logger.error(scope, error)
    return fail(
      'INTERNAL',
      isQueryTimeout(error)
        ? ANALYTICS_TIMEOUT_MESSAGE
        : 'Failed to load analytics'
    )
  }
}

function named(rows: SessionMetricRow[], dimension: SessionDimension): Named[] {
  return rows.map((row) => ({
    name: row.dimensions[dimension] ?? '',
    ...deriveSessionMetrics(row.metrics),
  }))
}

function fillSeries(rows: SessionMetricRow[], keys: string[]): SeriesPoint[] {
  const byBucket = new Map(
    rows.map((row) => [row.dimensions.date, row.metrics])
  )
  return keys.map((bucket) => ({
    bucket,
    ...deriveSessionMetrics(byBucket.get(bucket) ?? EMPTY_SESSION_METRICS),
  }))
}

function totalsOf(rows: SessionMetricRow[]): DerivedSessionMetrics {
  return deriveSessionMetrics(rows[0]?.metrics ?? EMPTY_SESSION_METRICS)
}

export type AnalyticsOverview = {
  range: DateRange
  collectingSince: string | null
  totals: DerivedSessionMetrics
  previousTotals: DerivedSessionMetrics | null
  series: SeriesPoint[]
  previousSeries: SeriesPoint[] | null
  channels: Named[]
  devices: Named[]
  topPages: PageRow[]
}

export function getAnalyticsOverview(
  actor: Actor,
  filter: AnalyticsFilter,
  now: Date = new Date()
): Promise<ServiceResult<AnalyticsOverview>> {
  const range = resolveDateRange(filter, now)
  const base = { filter, bucket: range.bucket }
  const current = { ...base, start: range.start, end: range.end }
  const previous = {
    ...base,
    start: range.previousStart,
    end: range.previousEnd,
  }

  return runAnalyticsRead(actor, 'analytics.overview', async (tx) => {
    const totals = await aggregateSessions(tx, { ...current, dimensions: [] })
    const series = await aggregateSessions(tx, {
      ...current,
      dimensions: ['date'],
    })
    const channels = await aggregateSessions(tx, {
      ...current,
      dimensions: ['channel'],
      limit: 8,
    })
    const devices = await aggregateSessions(tx, {
      ...current,
      dimensions: ['deviceType'],
    })
    const topPages = await getPages(tx, {
      filter,
      start: range.start,
      end: range.end,
      limit: 8,
    })
    const since = await collectingSince(tx)
    const previousTotals = filter.compare
      ? await aggregateSessions(tx, { ...previous, dimensions: [] })
      : null
    const previousSeries = filter.compare
      ? await aggregateSessions(tx, { ...previous, dimensions: ['date'] })
      : null

    return {
      range,
      collectingSince: since?.toISOString() ?? null,
      totals: totalsOf(totals),
      previousTotals: previousTotals ? totalsOf(previousTotals) : null,
      series: fillSeries(
        series,
        bucketKeys(range.start, range.end, range.bucket)
      ),
      previousSeries: previousSeries
        ? fillSeries(
            previousSeries,
            bucketKeys(range.previousStart, range.previousEnd, range.bucket)
          )
        : null,
      channels: named(channels, 'channel'),
      devices: named(devices, 'deviceType'),
      topPages,
    }
  })
}

export type AnalyticsAcquisition = {
  channels: Named[]
  channelSeries: Array<Record<string, number | string>>
  channelOrder: string[]
  sources: Array<
    { source: string; medium: string; channel: string } & DerivedSessionMetrics
  >
  referrers: Named[]
  campaigns: Array<
    { campaign: string; source: string; medium: string } & DerivedSessionMetrics
  >
  landingPages: Named[]
}

// 범주 색은 8개뿐이라 상위 7개 채널 밖은 "Other"로 접는다.
const MAX_SERIES = 7

export function getAnalyticsAcquisition(
  actor: Actor,
  filter: AnalyticsFilter,
  now: Date = new Date()
): Promise<ServiceResult<AnalyticsAcquisition>> {
  const range = resolveDateRange(filter, now)
  const input = {
    filter,
    bucket: range.bucket,
    start: range.start,
    end: range.end,
  }

  return runAnalyticsRead(actor, 'analytics.acquisition', async (tx) => {
    const channels = named(
      await aggregateSessions(tx, { ...input, dimensions: ['channel'] }),
      'channel'
    )
    const byDate = await aggregateSessions(tx, {
      ...input,
      dimensions: ['date', 'channel'],
    })
    const sources = await aggregateSessions(tx, {
      ...input,
      dimensions: ['source', 'medium', 'channel'],
      limit: 50,
    })
    const referrers = await aggregateSessions(tx, {
      ...input,
      dimensions: ['referrer'],
      limit: 30,
    })
    const campaigns = await aggregateSessions(tx, {
      ...input,
      dimensions: ['campaign', 'source', 'medium'],
      limit: 30,
    })
    const landing = await aggregateSessions(tx, {
      ...input,
      dimensions: ['landingPath'],
      limit: 30,
    })

    const channelOrder = channels.slice(0, MAX_SERIES).map((row) => row.name)
    const hasOther = channels.length > MAX_SERIES
    const keys = bucketKeys(range.start, range.end, range.bucket)
    const channelSeries = keys.map((bucket) => {
      const point: Record<string, number | string> = { bucket }
      for (const name of channelOrder) point[name] = 0
      if (hasOther) point.Other = 0
      for (const row of byDate) {
        if (row.dimensions.date !== bucket) continue
        const name = channelOrder.includes(row.dimensions.channel!)
          ? row.dimensions.channel!
          : 'Other'
        point[name] = Number(point[name] ?? 0) + row.metrics.sessions
      }
      return point
    })

    return {
      channels,
      channelSeries,
      channelOrder: hasOther ? [...channelOrder, 'Other'] : channelOrder,
      sources: sources.map((row) => ({
        source: row.dimensions.source!,
        medium: row.dimensions.medium!,
        channel: row.dimensions.channel!,
        ...deriveSessionMetrics(row.metrics),
      })),
      referrers: named(referrers, 'referrer').filter(
        (row) => row.name !== '(direct)'
      ),
      campaigns: campaigns
        .filter((row) => row.dimensions.campaign !== '(not set)')
        .map((row) => ({
          campaign: row.dimensions.campaign!,
          source: row.dimensions.source!,
          medium: row.dimensions.medium!,
          ...deriveSessionMetrics(row.metrics),
        })),
      landingPages: named(landing, 'landingPath'),
    }
  })
}

export type AnalyticsEngagement = {
  pages: PageRow[]
  events: EventRow[]
  notFound: NotFoundRow[]
}

export function getAnalyticsEngagement(
  actor: Actor,
  filter: AnalyticsFilter,
  now: Date = new Date()
): Promise<ServiceResult<AnalyticsEngagement>> {
  const range = resolveDateRange(filter, now)
  const input = { filter, start: range.start, end: range.end }
  return runAnalyticsRead(actor, 'analytics.engagement', async (tx) => ({
    pages: await getPages(tx, input),
    events: await getEvents(tx, input),
    notFound: await getNotFound(tx, input),
  }))
}

export function getAnalyticsPageDetail(
  actor: Actor,
  filter: AnalyticsFilter,
  path: string,
  now: Date = new Date()
): Promise<ServiceResult<PageDetail & { range: DateRange }>> {
  const range = resolveDateRange(filter, now)
  return runAnalyticsRead(actor, 'analytics.page-detail', async (tx) => {
    const detail = await getPageDetail(tx, {
      filter,
      start: range.start,
      end: range.end,
      bucket: range.bucket,
      path,
    })
    const byBucket = new Map(
      detail.series.map((point) => [point.bucket, point.views])
    )
    return {
      ...detail,
      series: bucketKeys(range.start, range.end, range.bucket).map(
        (bucket) => ({ bucket, views: byBucket.get(bucket) ?? 0 })
      ),
      range,
    }
  })
}

export type AnalyticsAudience = {
  newVsReturning: Array<{
    bucket: string
    newUsers: number
    returningUsers: number
  }>
  retention: CohortRow[]
  devices: Named[]
  browsers: Named[]
  operatingSystems: Named[]
  screens: Named[]
  languages: Named[]
  countries: Named[]
  hourWeekday: Array<{ weekday: number; hour: number; sessions: number }>
}

export function getAnalyticsAudience(
  actor: Actor,
  filter: AnalyticsFilter,
  now: Date = new Date()
): Promise<ServiceResult<AnalyticsAudience>> {
  const range = resolveDateRange(filter, now)
  const input = {
    filter,
    bucket: range.bucket,
    start: range.start,
    end: range.end,
  }
  const by = (tx: QueryExecutor, dimension: SessionDimension, limit = 10) =>
    aggregateSessions(tx, { ...input, dimensions: [dimension], limit }).then(
      (rows) => named(rows, dimension)
    )

  return runAnalyticsRead(actor, 'analytics.audience', async (tx) => {
    const visitorRows = await aggregateSessions(tx, {
      ...input,
      dimensions: ['date', 'visitorType'],
    })
    const heat = await aggregateSessions(tx, {
      ...input,
      dimensions: ['weekday', 'hour'],
    })
    return {
      newVsReturning: bucketKeys(range.start, range.end, range.bucket).map(
        (bucket) => {
          const of = (type: string) =>
            visitorRows.find(
              (row) =>
                row.dimensions.date === bucket &&
                row.dimensions.visitorType === type
            )?.metrics.users ?? 0
          return {
            bucket,
            newUsers: of('new'),
            returningUsers: of('returning'),
          }
        }
      ),
      retention: await getRetention(tx, { filter, end: range.end }),
      devices: await by(tx, 'deviceType'),
      browsers: await by(tx, 'browser'),
      operatingSystems: await by(tx, 'os'),
      screens: await by(tx, 'screen'),
      languages: await by(tx, 'language'),
      countries: await by(tx, 'country', 20),
      hourWeekday: heat.map((row) => ({
        weekday: Number(row.dimensions.weekday),
        hour: Number(row.dimensions.hour),
        sessions: row.metrics.sessions,
      })),
    }
  })
}

export function getAnalyticsWebVitals(
  actor: Actor,
  filter: AnalyticsFilter,
  now: Date = new Date()
): Promise<ServiceResult<WebVitalsReport>> {
  const range = resolveDateRange(filter, now)
  return runAnalyticsRead(actor, 'analytics.web-vitals', (tx) =>
    getWebVitals(tx, {
      filter,
      start: range.start,
      end: range.end,
      bucket: range.bucket,
    })
  )
}

export function getAnalyticsRealtime(
  actor: Actor,
  includeInternal: boolean,
  now: Date = new Date()
): Promise<ServiceResult<RealtimeSnapshot>> {
  return runAnalyticsRead(actor, 'analytics.realtime', (tx) =>
    getRealtime(tx, { now, includeInternal })
  )
}

export const ANALYTICS_TABLE_REPORTS = [
  'channels',
  'sources',
  'referrers',
  'campaigns',
  'landing_pages',
  'devices',
  'browsers',
  'os',
  'screens',
  'countries',
  'languages',
  'pages',
  'events',
  'not_found',
  'web_vitals',
  'explore',
] as const

export type AnalyticsTableReport = (typeof ANALYTICS_TABLE_REPORTS)[number]

export type ExploreInput = {
  dimensions: SessionDimension[]
  metrics: SessionMetricKey[]
  limit: number
}

const DEFAULT_EXPLORE: ExploreInput = {
  dimensions: ['channel'],
  metrics: ['users', 'sessions', 'engagementRate', 'avgEngagementSeconds'],
  limit: 100,
}

function listParam<T extends string>(
  value: string | string[] | undefined,
  options: readonly T[]
): T[] {
  if (typeof value !== 'string') return []
  return value
    .split(',')
    .filter((item): item is T => (options as readonly string[]).includes(item))
}

/** 탐색은 차원 최대 2개. 잘못된 값은 버리고, 남는 것이 없으면 기본값을 쓴다. */
export function parseExploreInput(params: SearchParamsRecord): ExploreInput {
  const dimensions = [
    ...new Set(listParam(params.dims, SESSION_DIMENSIONS)),
  ].slice(0, 2)
  const metrics = [...new Set(listParam(params.metrics, SESSION_METRIC_KEYS))]
  const limit = Number(typeof params.limit === 'string' ? params.limit : NaN)
  return {
    dimensions: dimensions.length > 0 ? dimensions : DEFAULT_EXPLORE.dimensions,
    metrics: metrics.length > 0 ? metrics : DEFAULT_EXPLORE.metrics,
    limit:
      Number.isInteger(limit) && limit > 0
        ? Math.min(limit, 500)
        : DEFAULT_EXPLORE.limit,
  }
}

export type AnalyticsTable = {
  columns: string[]
  rows: Array<Record<string, string | number | null>>
}

const ROUND = (value: number) => Math.round(value * 10_000) / 10_000

function sessionTable(
  rows: SessionMetricRow[],
  dimensions: SessionDimension[],
  metrics: readonly SessionMetricKey[]
): AnalyticsTable {
  return {
    columns: [...dimensions, ...metrics],
    rows: rows.map((row) => {
      const derived = deriveSessionMetrics(row.metrics)
      return {
        ...Object.fromEntries(
          dimensions.map((dimension) => [
            dimension,
            row.dimensions[dimension] ?? null,
          ])
        ),
        ...Object.fromEntries(
          metrics.map((metric) => [metric, ROUND(derived[metric])])
        ),
      }
    }),
  }
}

const SESSION_REPORT_DIMENSIONS: Partial<
  Record<AnalyticsTableReport, SessionDimension[]>
> = {
  channels: ['channel'],
  sources: ['source', 'medium'],
  referrers: ['referrer'],
  campaigns: ['campaign', 'source', 'medium'],
  landing_pages: ['landingPath'],
  devices: ['deviceType'],
  browsers: ['browser'],
  os: ['os'],
  screens: ['screen'],
  countries: ['country'],
  languages: ['language'],
}

/** CSV와 MCP `analytics_report`가 쓰는 평평한 표. */
export function getAnalyticsTable(
  actor: Actor,
  report: AnalyticsTableReport,
  filter: AnalyticsFilter,
  explore: ExploreInput = DEFAULT_EXPLORE,
  now: Date = new Date()
): Promise<ServiceResult<AnalyticsTable>> {
  const range = resolveDateRange(filter, now)
  const input = { filter, start: range.start, end: range.end }

  return runAnalyticsRead(
    actor,
    `analytics.table.${report}`,
    async (tx): Promise<AnalyticsTable> => {
      const sessionDimensions =
        report === 'explore'
          ? explore.dimensions
          : SESSION_REPORT_DIMENSIONS[report]
      if (sessionDimensions) {
        const rows = await aggregateSessions(tx, {
          ...input,
          bucket: range.bucket,
          dimensions: sessionDimensions,
          limit: report === 'explore' ? explore.limit : 200,
        })
        return sessionTable(
          rows,
          sessionDimensions,
          report === 'explore' ? explore.metrics : SESSION_METRIC_KEYS
        )
      }
      if (report === 'pages') {
        const rows = await getPages(tx, { ...input, limit: 500 })
        return {
          columns: [
            'path',
            'title',
            'contentGroup',
            'views',
            'users',
            'avgEngagementSeconds',
            'scroll75Rate',
            'entrances',
            'exits',
            'exitRate',
          ],
          rows: rows.map((row) => ({
            ...row,
            avgEngagementSeconds: ROUND(row.avgEngagementSeconds),
            scroll75Rate: ROUND(row.scroll75Rate),
            exitRate: ROUND(row.exitRate),
          })),
        }
      }
      if (report === 'events') {
        return {
          columns: ['name', 'label', 'count', 'sessions'],
          rows: await getEvents(tx, { ...input, limit: 500 }),
        }
      }
      if (report === 'not_found') {
        return {
          columns: ['path', 'referrer', 'views'],
          rows: await getNotFound(tx, { ...input, limit: 500 }),
        }
      }
      const vitals = await getWebVitals(tx, { ...input, bucket: range.bucket })
      return {
        columns: [
          'metric',
          'p75',
          'good',
          'needsImprovement',
          'poor',
          'samples',
        ],
        rows: vitals.summary.map((row) => ({
          ...row,
          p75: row.p75 === null ? null : ROUND(row.p75),
        })),
      }
    }
  )
}
