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

import {
  resolveScopeFromOptions,
  serializeAdminGenerationScope,
  type AdminGenerationOption,
  type AdminGenerationScope,
} from '@/lib/admin/generation-scope'

export {
  ADMIN_GENERATION_SCOPE_ALL,
  resolveScopeFromOptions,
  serializeAdminGenerationScope,
  type AdminGenerationOption,
  type AdminGenerationScope,
} from '@/lib/admin/generation-scope'

/** 선택한 기수 범위를 기억하는 쿠키 이름. */
export const ADMIN_GENERATION_SCOPE_COOKIE = 'admin-generation-scope'
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
  const options = await loadAccessibleGenerations({ userId, role })

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
  const options = await loadAccessibleGenerations({ userId, role })
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
