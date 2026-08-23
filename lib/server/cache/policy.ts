export const cacheLifeConfig = {
  home: {
    stale: 60 * 15,
    revalidate: 60 * 60,
    expire: 60 * 60 * 24,
  },
  generationIndex: {
    stale: 60 * 60,
    revalidate: 60 * 60 * 6,
    expire: 60 * 60 * 24 * 7,
  },
  memberDirectory: {
    stale: 60 * 60,
    revalidate: 60 * 60 * 6,
    expire: 60 * 60 * 24 * 7,
  },
  projectList: {
    stale: 60 * 60,
    revalidate: 60 * 60 * 6,
    expire: 60 * 60 * 24 * 7,
  },
  projectDetail: {
    stale: 60 * 60 * 6,
    revalidate: 60 * 60 * 24,
    expire: 60 * 60 * 24 * 30,
  },
  sessionList: {
    stale: 60 * 15,
    revalidate: 60 * 60,
    // Session visibility is keyed by an hourly bucket. Older buckets can
    // never be reused, so expiring after two hours bounds otherwise-dead
    // Redis entries without changing the one-hour refresh contract.
    expire: 60 * 60 * 2,
  },
  sessionDetail: {
    stale: 60 * 15,
    revalidate: 60 * 60,
    expire: 60 * 60 * 2,
  },
  sitemap: {
    stale: 60 * 60,
    revalidate: 60 * 60 * 6,
    expire: 60 * 60 * 24 * 7,
  },
} as const

export const publicCachePolicy = {
  home: 'home',
  generationIndex: 'generationIndex',
  memberDirectory: 'memberDirectory',
  projectList: 'projectList',
  projectDetail: 'projectDetail',
  sessionList: 'sessionList',
  sessionDetail: 'sessionDetail',
  sitemap: 'sitemap',
} as const

export type PublicCacheProfile =
  (typeof publicCachePolicy)[keyof typeof publicCachePolicy]

export const SESSION_VISIBILITY_BUCKET_MS = 60 * 60 * 1000

export function getSessionVisibilityBucket(date = new Date()): string {
  const bucketStart = new Date(
    Math.floor(date.getTime() / SESSION_VISIBILITY_BUCKET_MS) *
      SESSION_VISIBILITY_BUCKET_MS
  )

  return bucketStart.toISOString()
}
