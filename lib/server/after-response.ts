/**
 * 응답을 보낸 뒤에 실행할 부수 작업 예약.
 *
 * 알림 메일처럼 실패해도 본 작업 결과에는 영향이 없고 사용자가 기다릴 필요도 없는
 * 일은 Next.js `after()`로 미뤄 응답 지연을 없앤다. 예약된 작업의 예외는 호출부로
 * 전파되지 않으므로 여기서 로그로 남긴다.
 */
import 'server-only'

import { after } from 'next/server'
import { logger } from '@/lib/server/logger'

/**
 * 응답 이후 실행할 작업을 예약한다.
 *
 * @param scope - 실패 시 남길 로그 범위
 * @param task - 실행할 비동기 작업
 * @param metadata - 실패 로그에 함께 남길 식별자(비밀값·개인정보 금지)
 */
export function runAfterResponse(
  scope: string,
  task: () => Promise<void>,
  metadata?: Record<string, unknown>
): void {
  after(async () => {
    try {
      await task()
    } catch (error) {
      logger.error(scope, error, metadata)
    }
  })
}
