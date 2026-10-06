// 기수 쿠키는 요청마다 권한에 맞춰 해석한다. LEAD는 전체, 다른 역할은 소속 기수만 고른다.
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

export const ADMIN_GENERATION_SCOPE_COOKIE = 'admin-generation-scope'
// 기수 선택지는 최신순이며 canAccessAll은 LEAD에게만 true다.
export type ResolvedAdminGenerationScope = {
  canAccessAll: boolean
  options: AdminGenerationOption[]
  scope: AdminGenerationScope | null
  selectedGeneration: AdminGenerationOption | null
}

// 요청 내 같은 scope 객체를 공유해야 fetcher의 React cache가 객체 동일성으로 중복 쿼리를 합친다.
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

// 접근 가능한 기수가 없으면 저장할 범위도 null이다.
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

// 수정 화면의 기수 전환 버튼은 해당 기수에 접근할 수 있을 때만 보인다.
export function canSwitchToGeneration(
  resolvedScope: ResolvedAdminGenerationScope | null | undefined,
  generationId: number
): boolean {
  return (
    resolvedScope?.canAccessAll === true ||
    resolvedScope?.options.some((option) => option.id === generationId) === true
  )
}
