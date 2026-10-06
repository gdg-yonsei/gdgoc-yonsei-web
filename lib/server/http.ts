// 관리자 응답은 private, no-store다. 실패는 { error }, 성공은 { success: true, ... }로 통일한다.
import 'server-only'

import { NextResponse } from 'next/server'
import type { z } from 'zod'
import type {
  ServiceErrorCode,
  ServiceFailure,
} from '@/lib/server/services/admin/types'

const privateNoStoreHeaders = {
  'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
  Vary: 'Cookie, Authorization',
} as const

export function privateJson(body: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...privateNoStoreHeaders,
      ...init?.headers,
    },
  })
}

export function privateError(error: string, status: number): NextResponse {
  return privateJson({ error }, { status })
}

export function privateOk<T extends object>(data?: T): NextResponse {
  return privateJson({ success: true, ...data })
}

export function privateForbidden(): NextResponse {
  return privateError('Forbidden', 403)
}

const SERVICE_ERROR_STATUS: Record<ServiceErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 400,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
}

// 권한 실패는 대상 존재 여부를 숨기기 위해 내부 메시지 대신 Forbidden만 반환한다.
export function serviceFailureResponse(failure: ServiceFailure): NextResponse {
  if (failure.code === 'FORBIDDEN') {
    return privateForbidden()
  }
  return privateError(failure.message, SERVICE_ERROR_STATUS[failure.code])
}

// 본문 검증 실패는 첫 오류 문구로 400을 반환한다.
export function parseRequestBody<Output>(
  schema: z.ZodType<Output>,
  input: unknown,
  fallback = 'Validation failed'
): { ok: true; data: Output } | { ok: false; response: NextResponse } {
  const result = schema.safeParse(input)

  if (!result.success) {
    return {
      ok: false,
      response: privateError(result.error.issues[0]?.message ?? fallback, 400),
    }
  }

  return { ok: true, data: result.data }
}
