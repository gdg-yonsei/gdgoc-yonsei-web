// 서버 로그는 [scope] message {metadata} 형식이다. metadata에 비밀값·개인정보를 넣지 않는다.
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
