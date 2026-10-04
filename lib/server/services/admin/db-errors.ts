/**
 * 서비스의 DB 작업을 감싸는 오류 처리.
 *
 * 쓰기 서비스는 권한·입력 검증을 마친 뒤 DB 작업을 한다. 이때 예상하지 못한 예외(연결 끊김, 제약 위반 등)는
 * 사용자에게 내부 오류로만 알리고 원인은 서버 로그에 남긴다. 함수마다 반복되던 try/catch를 이 헬퍼로 모은다.
 */
import 'server-only'

import { logger } from '@/lib/server/logger'
import { fail, type ServiceResult } from '@/lib/server/services/admin/types'

/**
 * `work`를 실행하고 그 결과(성공·실패 모두)를 그대로 돌려준다. 예외가 나면 `scope`와 `context`로 로그를
 * 남기고 `INTERNAL` 실패(`message`)로 바꾼다. 특정 예외를 다른 실패로 바꿔야 하는 곳(예: 정원 초과)은
 * 직접 try/catch를 쓴다.
 *
 * @param scope 로그 범위(`admin.sessions.update` 등)
 * @param context 로그에 함께 남길 값(대상 id 등)
 */
export async function withDbErrors<T>(
  scope: string,
  work: () => Promise<ServiceResult<T>>,
  context?: Record<string, unknown>,
  message = 'DB Update Error'
): Promise<ServiceResult<T>> {
  try {
    return await work()
  } catch (error) {
    logger.error(scope, error, context)
    return fail('INTERNAL', message)
  }
}
