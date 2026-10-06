import 'server-only'

import { cache } from 'react'
import { cacheLife } from 'next/cache'
import {
  getSessionVisibilityBucket,
  publicCachePolicy,
} from '@/lib/server/cache/policy'
import { sessionWallClockNow } from '@/lib/format/datetime'

// 사전 렌더링을 위해 세션 쿼리와 같은 1시간 캐시 버킷을 만들며 use cache 함수는 async여야 한다.
// 서울 벽시계 기준으로 만들어야 종료 뒤 약 9시간 늦게 공개되는 오류를 피한다.
// eslint-disable-next-line @typescript-eslint/require-await
async function getSharedSessionVisibilityBucket(): Promise<string> {
  'use cache: remote'

  cacheLife(publicCachePolicy.sessionList)

  return getSessionVisibilityBucket(sessionWallClockNow())
}

export const getCachedSessionVisibilityBucket = cache(() =>
  getSharedSessionVisibilityBucket()
)
