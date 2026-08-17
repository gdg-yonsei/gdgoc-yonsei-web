import 'server-only'

import { cacheLife } from 'next/cache'
import {
  getSessionVisibilityBucket,
  publicCachePolicy,
} from '@/lib/server/cache/policy'

/**
 * Captures the current publication window inside an explicit cache boundary so
 * Next.js can include session routes in the prerendered shell. The value and
 * the public session queries both refresh on the same hourly policy.
 */
export async function getCachedSessionVisibilityBucket(): Promise<string> {
  'use cache: remote'

  cacheLife(publicCachePolicy.sessionList)

  return getSessionVisibilityBucket()
}
