/**
 * 관리자 화면 기수 범위(generation scope).
 *
 * 관리자 화면 상단에서 기수를 고르면 목록·폼이 그 기수의 데이터만 다룬다. 선택값은
 * 쿠키(`admin-generation-scope`)에 저장하고, 매 요청마다 사용자 권한에 맞게 다시 해석한다.
 * LEAD는 "전체 기수"를 고를 수 있고, 다른 역할은 자신이 속한 기수만 고를 수 있다.
 */
import 'server-only'

import { cache } from 'react'
import { cookies } from 'next/headers'
import { getUserRole } from '@/lib/server/fetcher/admin/get-user-role'
import { loadAccessibleGenerations } from '@/lib/server/services/admin/authorize'

/** 선택한 기수 범위를 기억하는 쿠키 이름. */
export const ADMIN_GENERATION_SCOPE_COOKIE = 'admin-generation-scope'
/** "전체 기수"를 뜻하는 쿠키 값(LEAD 전용). */
export const ADMIN_GENERATION_SCOPE_ALL = 'all'

/** 기수 선택지(ID와 이름). */
export type AdminGenerationOption = {
  id: number
  name: string
}

/** 해석된 범위: 특정 기수 하나 또는 전체 기수. */
export type AdminGenerationScope =
  | {
      kind: 'generation'
      generationId: number
    }
  | {
      kind: 'all'
    }

/**
 * 요청 하나에 대해 해석한 범위 정보.
 * - canAccessAll: 전체 기수를 고를 수 있는지(LEAD)
 * - options: 고를 수 있는 기수 목록(최신순)
 * - scope / selectedGeneration: 현재 적용된 범위와 그 기수
 */
export type ResolvedAdminGenerationScope = {
  canAccessAll: boolean
  options: AdminGenerationOption[]
  scope: AdminGenerationScope | null
  selectedGeneration: AdminGenerationOption | null
}

/** 요청 값(쿠키 값 등)이 고를 수 있는 기수나 "전체"를 가리키면 범위로 바꾼다. 아니면 `null`. */
function parseRequestedGenerationScope(
  rawValue: string | undefined,
  options: AdminGenerationOption[],
  canAccessAll: boolean
): AdminGenerationScope | null {
  if (canAccessAll && rawValue === ADMIN_GENERATION_SCOPE_ALL) {
    return { kind: 'all' }
  }

  const generationId = Number(rawValue)
  if (!Number.isInteger(generationId)) {
    return null
  }

  const matched = options.find((option) => option.id === generationId)
  if (!matched) {
    return null
  }

  return {
    kind: 'generation',
    generationId: matched.id,
  }
}

/**
 * 요청된 기수 범위 값(쿠키 값, MCP 인자 등)을 접근 가능한 기수 목록에 맞춰 해석한다.
 *
 * 규칙: LEAD만 `all`을 고를 수 있고, 값이 없거나 권한 밖이면 가장 최근의 접근 가능
 * 기수로 대체한다. 접근 가능한 기수가 없으면 `null`. 웹(쿠키)과 서비스(MCP)가 같은
 * 규칙을 쓰도록 이 함수 하나에 둔다.
 */
export function resolveScopeFromOptions(
  options: AdminGenerationOption[],
  canAccessAll: boolean,
  requestedValue: string | undefined
): AdminGenerationScope | null {
  const fallback = options[0]
  if (!fallback) {
    return null
  }

  return (
    parseRequestedGenerationScope(requestedValue, options, canAccessAll) ?? {
      kind: 'generation',
      generationId: fallback.id,
    }
  )
}

/** 사용자가 접근할 수 있는 기수 목록(LEAD는 전체). */
async function loadAccessibleGenerationOptions(
  userId: string,
  role: Awaited<ReturnType<typeof getUserRole>>
): Promise<AdminGenerationOption[]> {
  return loadAccessibleGenerations({ userId, role })
}

/** 범위를 쿠키에 저장할 문자열로 바꾼다(`all` 또는 기수 ID). */
export function serializeAdminGenerationScope(
  scope: AdminGenerationScope | null
): string {
  if (!scope) {
    return ''
  }

  return scope.kind === 'all'
    ? ADMIN_GENERATION_SCOPE_ALL
    : String(scope.generationId)
}

/**
 * 현재 요청 사용자의 기수 범위를 쿠키에서 읽어 해석한다.
 *
 * 요청 단위로 메모이즈한다. 같은 요청 안의 모든 호출이 같은 scope 객체를 받아야
 * fetcher들의 `cache()`가 객체 동일성으로 중복 쿼리를 걸러 낼 수 있다.
 */
export const resolveAdminGenerationScope = cache(async function (
  userId: string
): Promise<ResolvedAdminGenerationScope> {
  const role = await getUserRole(userId)
  const canAccessAll = role === 'LEAD'
  const options = await loadAccessibleGenerationOptions(userId, role)

  if (options.length === 0) {
    return { canAccessAll, options, scope: null, selectedGeneration: null }
  }

  const cookieStore = await cookies()
  const scope = resolveScopeFromOptions(
    options,
    canAccessAll,
    cookieStore.get(ADMIN_GENERATION_SCOPE_COOKIE)?.value
  )
  const selectedGeneration =
    scope?.kind === 'generation'
      ? (options.find((option) => option.id === scope.generationId) ?? null)
      : null

  return { canAccessAll, options, scope, selectedGeneration }
})

/**
 * 기수 범위 전환 요청 값을 사용자 권한에 맞게 정규화해 쿠키에 저장할 문자열로 만든다.
 * 접근 가능한 기수가 없으면 `null`.
 */
export async function normalizeAdminGenerationScopeValueForUser(
  userId: string,
  requestedValue: string
): Promise<string | null> {
  const role = await getUserRole(userId)
  const options = await loadAccessibleGenerationOptions(userId, role)
  const scope = resolveScopeFromOptions(
    options,
    role === 'LEAD',
    requestedValue
  )

  return scope ? serializeAdminGenerationScope(scope) : null
}

/**
 * 현재 사용자가 상단 기수 범위를 `generationId`로 바꿀 수 있는지.
 * 수정 화면이 "다른 기수의 데이터" 안내에 전환 버튼을 보일지 정할 때 쓴다.
 */
export function canSwitchToGeneration(
  resolvedScope: ResolvedAdminGenerationScope | null | undefined,
  generationId: number
): boolean {
  return (
    resolvedScope?.canAccessAll === true ||
    resolvedScope?.options.some((option) => option.id === generationId) === true
  )
}
