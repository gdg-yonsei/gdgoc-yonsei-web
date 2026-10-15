/**
 * Search Console 응답을 인스턴스 간 공유 캐시에 6시간 둔다(API 할당량과 데이터 지연 때문).
 * 예외는 캐시되지 않으므로 권한·할당량 오류가 풀리면 다음 요청에 바로 반영된다.
 */
import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import {
  querySearchAnalytics,
  type SearchAnalyticsRequest,
  type SearchAnalyticsRow,
} from '@/lib/server/analytics/search-console/client'
import { getSearchConsoleEnv } from '@/lib/server/env'

export async function fetchSearchAnalytics(
  request: SearchAnalyticsRequest
): Promise<SearchAnalyticsRow[]> {
  'use cache: remote'

  cacheLife('searchConsole')
  cacheTag('search-console')

  const env = getSearchConsoleEnv()
  if (!env) return []
  return querySearchAnalytics(env, request)
}
