import { unstable_cache } from 'next/cache'

export type CacheTags =
  | 'users'
  | 'generations'
  | 'sessions'
  | 'projects'
  | 'parts'

/**
 * 캐시 재설정 태그 타입을 강제하는 unstable_cache
 * @param fb 데이터를 가져오는 함수
 * @param keyPair 함수 파라미터 외에 데이터를 가져오는데 영향을 주는 값
 * @param options revalidate: 캐시 무효 시간, tags: 데이터 캐시 태그
 */
export function dbCache(
  fb: Parameters<typeof unstable_cache>[0],
  keyPair: Parameters<typeof unstable_cache>[1],
  options: { revalidate?: number | false; tags?: CacheTags[] }
) {
  return unstable_cache(fb, keyPair, options)
}
