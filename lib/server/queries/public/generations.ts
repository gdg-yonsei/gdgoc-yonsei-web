/**
 * 공개 사이트 기수 목록 조회.
 *
 * 공개 사이트 조회는 모두 같은 구조다.
 * - `getShared*`: `'use cache: remote'` 함수. 결과를 Redis(또는 메모리)에 공유 캐시한다.
 *   행에 영어·한국어 필드가 모두 있으므로 언어와 무관하게 캐시 항목 하나를 쓰고, 기존 무효화
 *   규칙을 지키려고 두 언어의 태그를 모두 단다.
 * - `get*ForRequest`: React `cache()`로 같은 요청 안의 중복 호출을 합친다.
 * - 공개 함수(`get*`): 입력 검증(UUID 등) 후 위 함수를 부른다.
 */
import 'server-only'

import { cache } from 'react'
import { db } from '@/db'
import { generations } from '@/db/schema/generations'
import {
  cacheQuery,
  forEachPublicLocale,
  generationListTag,
} from '@/lib/server/cache'
import { publicCachePolicy } from '@/lib/server/cache/policy'
import { asc } from 'drizzle-orm'

async function getSharedGenerationSummaries() {
  'use cache: remote'

  cacheQuery(
    publicCachePolicy.generationIndex,
    forEachPublicLocale((locale) => [generationListTag(locale)])
  )

  return db
    .select({
      id: generations.id,
      name: generations.name,
      startDate: generations.startDate,
      endDate: generations.endDate,
    })
    .from(generations)
    .orderBy(asc(generations.startDate))
}

const getGenerationSummariesForRequest = cache(() =>
  getSharedGenerationSummaries()
)

/** 모든 기수의 이름·기간을 시작일 순으로 돌려준다. */
export function getGenerationSummaries() {
  return getGenerationSummariesForRequest()
}
