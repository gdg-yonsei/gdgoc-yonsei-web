import { CacheTag } from '@/types/cacheTag'
import { cacheTag } from 'next/cache'

export default function cacheTagT(...args: CacheTag[]) {
  return cacheTag(...args)
}
