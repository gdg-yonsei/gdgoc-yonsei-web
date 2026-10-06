// 부수 작업은 after로 응답 뒤에 실행한다. 예외가 호출부로 전달되지 않아 여기서 로그를 남긴다.
import 'server-only'

import { after } from 'next/server'
import { logger } from '@/lib/server/logger'

// 실패 로그의 metadata에는 비밀값·개인정보를 넣지 않는다.
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
