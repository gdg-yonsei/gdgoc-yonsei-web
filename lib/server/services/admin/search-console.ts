/**
 * 검색 탭·MCP가 쓰는 Search Console 읽기 서비스. 자격 증명이 없으면 실패 대신 `configured: false`를 돌려
 * 화면이 설정 안내를 그리게 한다. 우리 필터 중 기기·경로만 Search Console 요청에 반영된다.
 */
import 'server-only'

import { resolveDateRange, seoulDateString } from '@/lib/analytics/date-range'
import type { AnalyticsFilter } from '@/lib/analytics/filters'
import { deriveSessionMetrics } from '@/lib/analytics/metrics'
import {
  findLowCtr,
  findLowEngagementLandings,
  findStrikingDistance,
  pathFromSearchConsolePage,
  type LandingEngagement,
  type QueryPageRow,
  type SearchMetrics,
} from '@/lib/analytics/seo'
import { aggregateSessions } from '@/lib/server/analytics/queries/sessions'
import { withAnalyticsTimeout } from '@/lib/server/analytics/queries/sql'
import {
  SearchConsoleError,
  type SearchAnalyticsRequest,
  type SearchAnalyticsRow,
  type SearchDimension,
} from '@/lib/server/analytics/search-console/client'
import { fetchSearchAnalytics } from '@/lib/server/analytics/search-console/reports'
import { getSearchConsoleEnv } from '@/lib/server/env'
import { logger } from '@/lib/server/logger'
import { authorize } from '@/lib/server/services/admin/authorize'
import {
  fail,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'

export type SearchRow<K extends string> = Record<K, string> & SearchMetrics

type NotConfigured = { configured: false }

export type SearchConsoleOverview =
  | NotConfigured
  | {
      configured: true
      dataThrough: string
      totals: SearchMetrics
      previousTotals: SearchMetrics | null
      series: SearchRow<'date'>[]
      queries: SearchRow<'query'>[]
      pages: SearchRow<'page'>[]
      devices: SearchRow<'device'>[]
      countries: SearchRow<'country'>[]
    }

export type SeoOpportunities =
  | NotConfigured
  | {
      configured: true
      dataThrough: string
      lowCtr: Array<QueryPageRow & { expectedCtr: number }>
      strikingDistance: QueryPageRow[]
      lowEngagementLandings: Array<
        LandingEngagement & { impressions: number; clicks: number }
      >
    }

const DAY_MS = 24 * 60 * 60 * 1000
const EMPTY_METRICS: SearchMetrics = {
  clicks: 0,
  impressions: 0,
  ctr: 0,
  position: 0,
}

/** Search Console 날짜(YYYY-MM-DD, 양 끝 포함). 오늘 데이터는 거의 비어 있어 종료일을 어제로 자른다. */
export function searchDateWindow(filter: AnalyticsFilter, now: Date) {
  const range = resolveDateRange(filter, now)
  const yesterday = seoulDateString(new Date(now.getTime() - DAY_MS))
  const clamp = (date: string) => (date > yesterday ? yesterday : date)
  return {
    startDate: clamp(seoulDateString(range.start)),
    endDate: clamp(seoulDateString(new Date(range.end.getTime() - 1))),
    previousStartDate: seoulDateString(range.previousStart),
    previousEndDate: seoulDateString(new Date(range.previousEnd.getTime() - 1)),
  }
}

function requestFilters(
  filter: AnalyticsFilter
): Pick<SearchAnalyticsRequest, 'device' | 'pageContains'> {
  return {
    device: filter.device
      ? (filter.device.toUpperCase() as SearchAnalyticsRequest['device'])
      : undefined,
    pageContains: filter.path ?? undefined,
  }
}

function metricsOf(row: SearchAnalyticsRow | undefined): SearchMetrics {
  return row
    ? {
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }
    : EMPTY_METRICS
}

function keyed<K extends string>(
  rows: SearchAnalyticsRow[],
  key: K,
  map: (value: string) => string = (value) => value
) {
  return rows.map(
    (row) =>
      ({ [key]: map(row.keys[0] ?? ''), ...metricsOf(row) }) as SearchRow<K>
  )
}

function friendlyError(error: unknown): string {
  if (error instanceof SearchConsoleError) {
    if (error.status === 401 || error.status === 403) {
      return 'Search Console denied access. Add the service account email as a user on the Search Console property.'
    }
    if (error.status === 429)
      return 'The Search Console API quota is used up. Try again in a few minutes.'
    if (error.status === 400)
      return 'Search Console rejected the request. Check GSC_SITE_URL and the service account key.'
  }
  return 'Failed to load Search Console data'
}

async function runSearchRead<T>(
  actor: Actor,
  scope: string,
  work: () => Promise<T>
): Promise<ServiceResult<T | NotConfigured>> {
  const authorization = authorize(actor, 'get', 'analyticsPage')
  if (!authorization.ok) return authorization
  if (!getSearchConsoleEnv()) return ok({ configured: false })
  try {
    return ok(await work())
  } catch (error) {
    logger.error(scope, error)
    return fail('INTERNAL', friendlyError(error))
  }
}

export function getSearchConsoleOverview(
  actor: Actor,
  filter: AnalyticsFilter,
  now: Date = new Date()
): Promise<ServiceResult<SearchConsoleOverview>> {
  const window = searchDateWindow(filter, now)
  const base = {
    startDate: window.startDate,
    endDate: window.endDate,
    ...requestFilters(filter),
  }
  const by = (dimension: SearchDimension, rowLimit: number) =>
    fetchSearchAnalytics({ ...base, dimensions: [dimension], rowLimit })

  return runSearchRead(actor, 'analytics.search-console.overview', async () => {
    const [totals, previous, series, queries, pages, devices, countries] =
      await Promise.all([
        fetchSearchAnalytics({ ...base, dimensions: [], rowLimit: 1 }),
        filter.compare
          ? fetchSearchAnalytics({
              ...base,
              startDate: window.previousStartDate,
              endDate: window.previousEndDate,
              dimensions: [],
              rowLimit: 1,
            })
          : Promise.resolve(null),
        by('date', 500),
        by('query', 100),
        by('page', 100),
        by('device', 10),
        by('country', 20),
      ])
    return {
      configured: true as const,
      dataThrough: window.endDate,
      totals: metricsOf(totals[0]),
      previousTotals: previous ? metricsOf(previous[0]) : null,
      series: keyed(series, 'date'),
      queries: keyed(queries, 'query'),
      pages: keyed(pages, 'page', pathFromSearchConsolePage),
      devices: keyed(devices, 'device', (value) => value.toLowerCase()),
      countries: keyed(countries, 'country', (value) => value.toUpperCase()),
    }
  })
}

export function getSeoOpportunities(
  actor: Actor,
  filter: AnalyticsFilter,
  now: Date = new Date()
): Promise<ServiceResult<SeoOpportunities>> {
  const window = searchDateWindow(filter, now)
  const range = resolveDateRange(filter, now)
  const base = {
    startDate: window.startDate,
    endDate: window.endDate,
    ...requestFilters(filter),
  }

  return runSearchRead(
    actor,
    'analytics.search-console.opportunities',
    async () => {
      const [queryPages, pages, landings] = await Promise.all([
        fetchSearchAnalytics({
          ...base,
          dimensions: ['query', 'page'],
          rowLimit: 1000,
        }),
        fetchSearchAnalytics({ ...base, dimensions: ['page'], rowLimit: 500 }),
        withAnalyticsTimeout((tx) =>
          aggregateSessions(tx, {
            filter: { ...filter, channel: 'Organic Search' },
            start: range.start,
            end: range.end,
            bucket: range.bucket,
            dimensions: ['landingPath'],
            limit: 200,
          })
        ),
      ])
      const rows: QueryPageRow[] = queryPages.map((row) => ({
        query: row.keys[0] ?? '',
        page: pathFromSearchConsolePage(row.keys[1] ?? ''),
        ...metricsOf(row),
      }))
      return {
        configured: true as const,
        dataThrough: window.endDate,
        lowCtr: findLowCtr(rows),
        strikingDistance: findStrikingDistance(rows),
        lowEngagementLandings: findLowEngagementLandings(
          landings.map((row) => {
            const derived = deriveSessionMetrics(row.metrics)
            return {
              path: row.dimensions.landingPath ?? '',
              sessions: derived.sessions,
              engagementRate: derived.engagementRate,
              avgEngagementSeconds: derived.avgEngagementSeconds,
            }
          }),
          pages.map((row) => ({ page: row.keys[0] ?? '', ...metricsOf(row) }))
        ),
      }
    }
  )
}

/** MCP `search_console_report`용 평평한 표. */
export function getSearchConsoleTable(
  actor: Actor,
  dimension: SearchDimension,
  filter: AnalyticsFilter,
  limit: number,
  now: Date = new Date()
): Promise<
  ServiceResult<
    | NotConfigured
    | {
        configured: true
        dataThrough: string
        rows: Array<Record<string, string | number>>
      }
  >
> {
  const window = searchDateWindow(filter, now)
  return runSearchRead(actor, 'analytics.search-console.table', async () => {
    const rows = await fetchSearchAnalytics({
      startDate: window.startDate,
      endDate: window.endDate,
      dimensions: [dimension],
      rowLimit: limit,
      ...requestFilters(filter),
    })
    return {
      configured: true as const,
      dataThrough: window.endDate,
      rows: keyed(
        rows,
        dimension,
        dimension === 'page' ? pathFromSearchConsolePage : undefined
      ),
    }
  })
}
