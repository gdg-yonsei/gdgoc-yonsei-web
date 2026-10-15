/** 분석 표를 CSV로 내려준다. 세션 쿠키로 행위자를 정하고 권한은 서비스가 확인한다. */
import type { NextRequest } from 'next/server'
import { toCsv } from '@/lib/analytics/csv'
import { parseAnalyticsFilter } from '@/lib/analytics/filters'
import { privateError, serviceFailureResponse } from '@/lib/server/http'
import {
  ANALYTICS_TABLE_REPORTS,
  getAnalyticsTable,
  parseExploreInput,
  type AnalyticsTableReport,
} from '@/lib/server/services/admin/analytics'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

export async function GET(request: NextRequest) {
  const actor = await getWebActor()
  if (!actor) return privateError('Unauthorized', 401)

  const params = Object.fromEntries(request.nextUrl.searchParams)
  const report = params.report as AnalyticsTableReport
  if (!(ANALYTICS_TABLE_REPORTS as readonly string[]).includes(report)) {
    return privateError('Unknown report', 400)
  }

  const result = await getAnalyticsTable(
    actor,
    report,
    parseAnalyticsFilter(params),
    parseExploreInput(params)
  )
  if (!result.ok) return serviceFailureResponse(result)

  return new Response(toCsv(result.data.columns, result.data.rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="gdgoc-analytics-${report}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
