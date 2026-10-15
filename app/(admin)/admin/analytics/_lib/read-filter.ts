/** 분석 페이지의 searchParams를 필터로 읽는다. 관리자 화면은 요청마다 새로 그리므로 connection()으로 동적 렌더링을 명시한다. */
import 'server-only'

import { connection } from 'next/server'
import {
  parseAnalyticsFilter,
  type AnalyticsFilter,
  type SearchParamsRecord,
} from '@/lib/analytics/filters'

export async function readAnalyticsFilter(
  searchParams: Promise<SearchParamsRecord>
): Promise<AnalyticsFilter> {
  await connection()
  return parseAnalyticsFilter(await searchParams)
}
