import 'server-only'

import type { z } from 'zod'
import { fromZodError, ok } from '@/lib/server/services/admin/types'
import { sessionValidation } from '@/lib/validations/session'

export type SessionInput = z.input<typeof sessionValidation>

export const NOT_FOUND = 'Session not found'

export function parseSessionInput(input: unknown) {
  const parsed = sessionValidation.safeParse(input)
  return parsed.success ? ok(parsed.data) : fromZodError(parsed.error)
}
