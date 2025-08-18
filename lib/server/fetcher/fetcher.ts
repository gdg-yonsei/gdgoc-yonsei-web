import { unstable_cache } from 'next/cache'
import { TagType } from '@/lib/server/cache'

//@ts-expect-error -- just for config unstable_cache
type Callback = (...args: any[]) => Promise<unknown>

/**
 * tag 타입을 강제하기 위해 unstable_cache 를 수정함
 *
 * 동작은 unstable_cache와 동일
 * @param cb - 데이터 쿼리 함수 (Promise를 리턴)
 * @param keyParts - 함수의 매개변수에 들어가지 않지만 쿼리 결과에 영향을 줄 수 있는 변수를 캐시 값에 인위적으로 지정
 * @param options - 캐시 옵션
 */
export function fetcher<T extends Callback>(
  cb: T,
  keyParts?: string[],
  options?: { revalidate?: number | false; tags?: TagType[] }
): T {
  return unstable_cache(cb, keyParts, options)
}
