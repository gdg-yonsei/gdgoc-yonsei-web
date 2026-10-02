/**
 * 공개 데이터 캐시 진입점.
 *
 * 공개 쿼리(`lib/server/queries/public/*`)는 `'use cache: remote'` 함수 안에서
 * `cacheQuery()`로 수명 프로필과 태그를 붙인다. 태그·정책·무효화 함수도 이 모듈에서
 * 다시 내보내므로 호출부는 `@/lib/server/cache` 하나만 import하면 된다.
 */
import 'server-only'

import {
  cacheLife,
  cacheTag,
  revalidatePath,
  revalidateTag,
  updateTag,
} from 'next/cache'
import {
  cacheLifeConfig,
  type PublicCacheProfile,
} from '@/lib/server/cache/policy'
import { uniqueStrings } from '@/lib/server/cache/utils'

export * from '@/lib/server/cache/invalidation'
export * from '@/lib/server/cache/policy'
export * from '@/lib/server/cache/tags'
export * from '@/lib/server/cache/utils'
export { revalidatePath, revalidateTag, updateTag }

/** 현재 `use cache` 항목에 수명 프로필과 태그를 붙인다. 쿼리를 실행하기 전에 부른다. */
export function cacheQuery(
  profile: PublicCacheProfile,
  tags: readonly string[]
) {
  cacheLife(cacheLifeConfig[profile])
  cacheTag(...uniqueStrings(tags))
}

/**
 * 쿼리를 실행한 뒤 결과에 따라 태그를 더 붙인다(예: 결과에 나온 기수마다 태그 하나).
 * `cacheTag()`는 한 번에 최대 128개까지만 받으므로 나눠서 부른다.
 */
export function tagQuery(tags: readonly string[]) {
  const unique = uniqueStrings(tags)
  for (let index = 0; index < unique.length; index += 128) {
    cacheTag(...unique.slice(index, index + 128))
  }
}
