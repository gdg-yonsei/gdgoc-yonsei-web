/**
 * 현재 세션 공개 버킷을 캐시 경계 안에서 계산한다.
 */
import 'server-only'

import { cache } from 'react'
import { cacheLife } from 'next/cache'
import {
  getSessionVisibilityBucket,
  publicCachePolicy,
} from '@/lib/server/cache/policy'
import { sessionWallClockNow } from '@/lib/format/datetime'

/**
 * 현재 공개 시간대 버킷을 명시적인 캐시 경계 안에서 계산한다. 이렇게 해야 Next.js가
 * 세션 페이지를 미리 렌더링한 셸에 포함할 수 있다. 이 값과 공개 세션 쿼리는 같은
 * 1시간 정책으로 함께 갱신된다.
 *
 * 세션 시작·종료 시각은 서울 벽시계 시각을 UTC 라벨로 저장하므로, 실제 시각이 아니라
 * `sessionWallClockNow()`로 버킷을 만든다. 그렇지 않으면 세션이 끝나고 약 9시간 뒤에야
 * 공개 사이트에 나타난다.
 */
// 'use cache' 함수는 await가 없어도 async여야 한다.
// eslint-disable-next-line @typescript-eslint/require-await
async function getSharedSessionVisibilityBucket(): Promise<string> {
  'use cache: remote'

  cacheLife(publicCachePolicy.sessionList)

  return getSessionVisibilityBucket(sessionWallClockNow())
}

/** 요청 안에서는 한 번만 계산하도록 React `cache()`로 감싼 버킷 조회. */
export const getCachedSessionVisibilityBucket = cache(() =>
  getSharedSessionVisibilityBucket()
)
