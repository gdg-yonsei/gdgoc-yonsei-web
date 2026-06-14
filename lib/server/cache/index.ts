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
