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

/**
 * 실패 응답. 모든 관리자 API 는 실패를 `{ error }` 한 가지 형태로만 돌려준다.
 */
export function privateError(error: string, status: number): NextResponse {
  return privateJson({ error }, { status })
}

/**
 * 성공 응답. 돌려줄 데이터가 없을 때도 `{ success: true }` 로 형태를 맞춘다.
 *
 * 이전에는 같은 "성공했고 돌려줄 값은 없음" 을 어떤 라우트는 `{ success: true }`,
 * 어떤 라우트는 `{ message: 'success' }` 로 응답해 호출부가 라우트마다
 * 다르게 처리해야 했다.
 */
export function privateOk<T extends object>(data?: T): NextResponse {
  return privateJson({ success: true, ...data })
}

export function privateForbidden(): NextResponse {
  return privateError('Forbidden', 403)
}

/** 서비스 실패 코드별 HTTP 상태 코드. */
const SERVICE_ERROR_STATUS: Record<ServiceErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 400,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
}

/**
 * 서비스 실패를 관리자 API 응답으로 바꾼다.
 * 권한 실패는 메시지 대신 항상 `Forbidden`만 돌려줘, 대상 존재 여부 같은 내부
 * 정보를 드러내지 않는다.
 */
export function serviceFailureResponse(failure: ServiceFailure): NextResponse {
  if (failure.code === 'FORBIDDEN') {
    return privateForbidden()
  }
  return privateError(failure.message, SERVICE_ERROR_STATUS[failure.code])
}

/**
 * 요청 본문을 검증하고, 실패하면 그대로 반환할 수 있는 400 응답을 돌려준다.
 *
 * 여섯 개 라우트가 `safeParse` 결과에서 첫 이슈 메시지를 꺼내는 같은 여덟 줄을
 * 복사해 쓰고 있었다.
 */
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
