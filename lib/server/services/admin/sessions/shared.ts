/**
 * 세션 서비스 모듈들이 함께 쓰는 상수와 입력 검증.
 */
import 'server-only'

import type { z } from 'zod'
import { fromZodError, ok } from '@/lib/server/services/admin/types'
import { sessionValidation } from '@/lib/validations/session'

/** 세션 입력(검증 전) 타입. 부분 수정 시 기존 값과 병합할 때도 쓴다. */
export type SessionInput = z.input<typeof sessionValidation>

/** 세션을 찾지 못했을 때의 오류 문구. */
export const NOT_FOUND = 'Session not found'

/** 세션 입력을 검증해 서비스 결과로 돌려준다. */
export function parseSessionInput(input: unknown) {
  const parsed = sessionValidation.safeParse(input)
  return parsed.success ? ok(parsed.data) : fromZodError(parsed.error)
}
