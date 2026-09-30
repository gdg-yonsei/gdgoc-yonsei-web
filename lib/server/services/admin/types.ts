import 'server-only'

import type { z } from 'zod'
import type { roleEnum } from '@/db/schema/users'

export type Role = (typeof roleEnum.enumValues)[number]

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

export function fromZodError(error: z.ZodError): ServiceFailure {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_'
    ;(fieldErrors[key] ??= []).push(issue.message)
  }
  return fail(
    'VALIDATION',
    error.issues[0]?.message ?? 'Validation error',
    fieldErrors
  )
}
