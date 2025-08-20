import { CacheTag } from '@/lib/types/cacheTag'
import { unstable_cacheTag } from 'next/cache'

export default function cacheTag(...args: CacheTag[]) {
  return unstable_cacheTag(...args)
}
