/** Search Console Search Analytics API 호출. 응답 행을 그대로 돌려주고, 실패는 HTTP 상태를 담은 SearchConsoleError로 던진다. */
import 'server-only'

import { SearchConsoleError } from '@/lib/server/analytics/search-console/errors'
import { getAccessToken } from '@/lib/server/analytics/search-console/token'
import type { SearchConsoleEnv } from '@/lib/server/env'

export { SearchConsoleError }

export type SearchDimension = 'query' | 'page' | 'device' | 'country' | 'date'

export type SearchAnalyticsRequest = {
  startDate: string
  endDate: string
  dimensions: SearchDimension[]
  rowLimit: number
  device?: 'MOBILE' | 'DESKTOP' | 'TABLET'
  pageContains?: string
}

export type SearchAnalyticsRow = {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export async function querySearchAnalytics(
  env: SearchConsoleEnv,
  request: SearchAnalyticsRequest,
  fetchImpl: typeof fetch = fetch
): Promise<SearchAnalyticsRow[]> {
  const filters = [
    ...(request.device
      ? [
          {
            dimension: 'device',
            operator: 'equals',
            expression: request.device,
          },
        ]
      : []),
    ...(request.pageContains
      ? [
          {
            dimension: 'page',
            operator: 'contains',
            expression: request.pageContains,
          },
        ]
      : []),
  ]
  const token = await getAccessToken(env, fetchImpl)
  const response = await fetchImpl(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(env.siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: request.startDate,
        endDate: request.endDate,
        dimensions: request.dimensions,
        rowLimit: request.rowLimit,
        type: 'web',
        // 최근 2~3일의 잠정 데이터까지 받는다. 화면에는 기준일을 따로 표시한다.
        dataState: 'all',
        ...(filters.length > 0
          ? { dimensionFilterGroups: [{ groupType: 'and', filters }] }
          : {}),
      }),
    }
  )
  const body = (await response.json().catch(() => ({}))) as {
    rows?: SearchAnalyticsRow[]
    error?: { message?: string }
  }
  if (!response.ok) {
    throw new SearchConsoleError(
      response.status,
      body.error?.message ?? 'Search Console request failed'
    )
  }
  return (body.rows ?? []).map((row) => ({
    keys: row.keys ?? [],
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }))
}
