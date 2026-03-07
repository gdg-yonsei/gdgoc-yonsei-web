import 'server-only'

export class AppError extends Error {
  readonly code: string

  constructor(message: string, options?: { code?: string; cause?: unknown }) {
    super(message, options?.cause ? { cause: options.cause } : undefined)
    this.name = 'AppError'
    this.code = options?.code ?? 'APP_ERROR'
  }
}

export function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  return new AppError('Unexpected non-Error thrown', {
    code: 'UNEXPECTED_THROWN_VALUE',
    cause: error,
  })
}
