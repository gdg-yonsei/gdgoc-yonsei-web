// 예상 밖 DB 오류는 사용자에게 내부 오류로만 알리고 원인은 서버 로그에 남긴다.
import 'server-only'

import { logger } from '@/lib/server/logger'
import { fail, type ServiceResult } from '@/lib/server/services/admin/types'

// 예외는 scope·context와 함께 기록하고 INTERNAL 실패로 바꾼다.
// 정원 초과처럼 특정 예외를 구별해야 하면 호출부에서 직접 try/catch한다.
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
