import { CacheTag } from '@/types/cacheTag'
import { cacheTag } from 'next/cache'

export default function applyCacheTags(...args: CacheTag[]) {
  return cacheTag(...args)
}
