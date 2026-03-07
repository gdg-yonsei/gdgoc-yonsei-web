import 'server-only'

import { normalizeError } from '@/lib/server/errors'

type LogMetadata = Record<string, unknown> | undefined

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
    const normalizedError = normalizeError(error)

    console.error(
      `[${scope}] ${normalizedError.message}${formatMetadata(metadata)}`,
      normalizedError
    )
  },
}
