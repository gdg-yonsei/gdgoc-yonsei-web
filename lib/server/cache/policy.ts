// next.config가 가져오므로 server-only를 붙이지 않는다. 캐시 계약은 docs/architecture/caching.md에 있다.

/** 프로필별 수명(초). `next.config.ts`의 `cacheLife`로 등록된다. */
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
    // 세션 공개 여부는 1시간 단위 버킷을 키로 쓴다. 지난 버킷은 다시 쓰이지 않으므로,
    // 2시간 뒤 만료시켜 쓸모없는 Redis 키를 정리한다(1시간 갱신 약속은 그대로다).
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

// 현재 시각을 1시간 버킷 시작으로 내려 끝난 세션을 조회하는 같은 시간대 요청이 캐시를 공유하게 한다.
export function getSessionVisibilityBucket(date = new Date()): string {
  const bucketStart = new Date(
    Math.floor(date.getTime() / SESSION_VISIBILITY_BUCKET_MS) *
      SESSION_VISIBILITY_BUCKET_MS
  )

  return bucketStart.toISOString()
}
