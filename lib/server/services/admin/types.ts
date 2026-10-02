import 'server-only'

import type { z } from 'zod'
import type { Role } from '@/db/schema/users'

export type { Role }

export const SCOPES = ['gyms:read', 'gyms:write', 'gyms:admin'] as const
export type Scope = (typeof SCOPES)[number]

/**
 * 서비스 호출 주체. 웹 Server Action 과 MCP 도구가 같은 서비스를 쓰도록
 * 요청 컨텍스트(쿠키, 헤더) 대신 호출자가 명시적으로 넘긴다.
 */
export type Actor = {
  userId: string
  role: Role
  /** 웹 세션은 스코프 제한이 없다. */
  scopes: Scope[] | 'session'
  via: 'web' | 'mcp'
  clientId?: string
}

export type ServiceErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL'

export type ServiceFailure = {
  ok: false
  code: ServiceErrorCode
  message: string
  fieldErrors?: Record<string, string[]>
}

export type ServiceResult<T> = { ok: true; data: T } | ServiceFailure

export function ok<T>(data: T): { ok: true; data: T } {
  return { ok: true, data }
}

export function fail(
  code: ServiceErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
): ServiceFailure {
  return fieldErrors
    ? { ok: false, code, message, fieldErrors }
    : { ok: false, code, message }
}

/**
 * zod 오류를 필드별 오류 문구 목록으로 바꾼다. 경로가 없는 오류는 `_` 키에 모은다.
 */
export function fieldErrorsFromZod(
  error: z.ZodError
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_'
    ;(fieldErrors[key] ??= []).push(issue.message)
  }
  return fieldErrors
}

/** zod 검증 실패를 서비스 실패(VALIDATION)로 바꾼다. 첫 오류 문구를 대표 메시지로 쓴다. */
export function fromZodError(error: z.ZodError): ServiceFailure {
  return fail(
    'VALIDATION',
    error.issues[0]?.message ?? 'Validation error',
    fieldErrorsFromZod(error)
  )
}
