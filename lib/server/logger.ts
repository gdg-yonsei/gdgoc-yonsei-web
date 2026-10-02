/**
 * 서버 로그 출력 헬퍼.
 *
 * 모든 서버 코드는 `console`을 직접 쓰지 않고 이 로거를 거친다. 로그 한 줄이
 * `[scope] message {metadata}` 형태가 되어 배포 환경 로그에서 검색하기 쉽다.
 * 메타데이터에는 비밀값이나 개인정보를 넣지 않는다.
 */
import 'server-only'

type LogMetadata = Record<string, unknown> | undefined

/** `throw`된 값이 Error가 아닐 때(문자열 등)도 스택과 메시지를 남길 수 있게 감싼다. */
function toError(error: unknown): Error {
  return error instanceof Error
    ? error
    : new Error('Unexpected non-Error thrown', { cause: error })
}

function formatMetadata(metadata: LogMetadata): string {
  return metadata ? ` ${JSON.stringify(metadata)}` : ''
}

/** 범위(scope) 이름과 함께 로그를 남긴다. 범위는 `영역.기능` 형식으로 적는다. */
export const logger = {
  info(scope: string, message: string, metadata?: LogMetadata) {
    console.info(`[${scope}] ${message}${formatMetadata(metadata)}`)
  },
  warn(scope: string, message: string, metadata?: LogMetadata) {
    console.warn(`[${scope}] ${message}${formatMetadata(metadata)}`)
  },
  error(scope: string, error: unknown, metadata?: LogMetadata) {
    const normalizedError = toError(error)

    console.error(
      `[${scope}] ${normalizedError.message}${formatMetadata(metadata)}`,
      normalizedError
    )
  },
}
