// 공개 공유 쿼리는 use cache: remote 안에서 cacheQuery로 수명·태그를 붙인다.
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

export function cacheQuery(
  profile: PublicCacheProfile,
  tags: readonly string[]
) {
  cacheLife(cacheLifeConfig[profile])
  cacheTag(...uniqueStrings(tags))
}

// cacheTag는 한 번에 최대 128개이므로 결과별 태그를 나눠 붙인다.
export function tagQuery(tags: readonly string[]) {
  const unique = uniqueStrings(tags)
  for (let index = 0; index < unique.length; index += 128) {
    cacheTag(...unique.slice(index, index + 128))
  }
}
