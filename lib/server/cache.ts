import { revalidateTag } from 'next/cache'
import { CacheTag } from '@/types/cacheTag'

export function revalidateCache(tagList: CacheTag[] | CacheTag) {
  if (typeof tagList === 'string') {
    return revalidateTag(tagList)
  }
  for (const tag of tagList) {
    revalidateTag(tag)
  }
  return
}
