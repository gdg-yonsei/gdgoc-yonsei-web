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

/** `cacheQuery()`에 넘기는 프로필 이름 모음. 오타를 막기 위해 문자열 대신 이 값을 쓴다. */
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

/** 공개 캐시 프로필 이름 유니온. */
export type PublicCacheProfile =
  (typeof publicCachePolicy)[keyof typeof publicCachePolicy]

/** 세션 공개 시점 버킷 크기(1시간). */
export const SESSION_VISIBILITY_BUCKET_MS = 60 * 60 * 1000

/**
 * 주어진 시각이 속한 1시간 버킷의 시작 시각(ISO 문자열).
 *
 * 공개 세션 쿼리는 "끝난 세션만 공개"하므로 현재 시각이 필요하지만, 그대로 쓰면 캐시가
 * 매번 달라진다. 1시간 단위로 내려 같은 시간대의 요청이 캐시를 공유하게 한다.
 */
export function getSessionVisibilityBucket(date = new Date()): string {
  const bucketStart = new Date(
    Math.floor(date.getTime() / SESSION_VISIBILITY_BUCKET_MS) *
      SESSION_VISIBILITY_BUCKET_MS
  )

  return bucketStart.toISOString()
}
