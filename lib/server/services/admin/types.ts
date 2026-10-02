/**
 * 관리자 서비스 공통 타입: 호출 주체(Actor), OAuth 스코프, 서비스 결과(ServiceResult).
 */
import 'server-only'

import type { z } from 'zod'
import type { Role } from '@/db/schema/users'

/** 사용자 역할(DB `roleEnum`에서 파생). */
export type { Role }

/**
 * MCP OAuth 스코프. 읽기 ⊂ 쓰기 ⊂ 관리 순으로 강해진다.
 * - gyms:read: 조회
 * - gyms:write: 생성·수정
 * - gyms:admin: 삭제·역할 변경
 */
export const SCOPES = ['gyms:read', 'gyms:write', 'gyms:admin'] as const
/** OAuth 스코프 유니온. */
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

/** 서비스 실패 종류. HTTP 상태(`http.ts`)와 MCP 오류 코드로 각각 바뀐다. */
export type ServiceErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL'

/** 서비스 실패. `fieldErrors`는 입력 필드별 검증 오류. */
export type ServiceFailure = {
  ok: false
  code: ServiceErrorCode
  message: string
  fieldErrors?: Record<string, string[]>
}

/** 서비스 결과: 성공이면 `data`, 실패면 `ServiceFailure`. */
export type ServiceResult<T> = { ok: true; data: T } | ServiceFailure

/** 성공 결과를 만든다. */
export function ok<T>(data: T): { ok: true; data: T } {
  return { ok: true, data }
}

/** 실패 결과를 만든다. */
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
