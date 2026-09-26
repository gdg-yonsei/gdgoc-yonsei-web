import 'server-only'

import { cache } from 'react'
import { cacheLife } from 'next/cache'
import {
  getSessionVisibilityBucket,
  publicCachePolicy,
} from '@/lib/server/cache/policy'
import { sessionWallClockNow } from '@/lib/site/datetime'

/**
 * Captures the current publication window inside an explicit cache boundary so
 * Next.js can include session routes in the prerendered shell. The value and
 * the public session queries both refresh on the same hourly policy.
 *
 * Session start/end are Seoul wall-clock values stored with a UTC label, so
 * the bucket is built from `sessionWallClockNow()`, not the real instant —
 * otherwise sessions would appear on the public site ~9 hours after ending.
 */
async function getSharedSessionVisibilityBucket(): Promise<string> {
  'use cache: remote'

  cacheLife(publicCachePolicy.sessionList)

  return getSessionVisibilityBucket(sessionWallClockNow())
}

export const getCachedSessionVisibilityBucket = cache(() =>
  getSharedSessionVisibilityBucket()
)
