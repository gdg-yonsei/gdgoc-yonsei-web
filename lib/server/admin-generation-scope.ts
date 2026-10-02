import 'server-only'

import { cache } from 'react'
import { headers } from 'next/headers'
import { getUserRole } from '@/lib/server/fetcher/admin/get-user-role'
import { loadAccessibleGenerations } from '@/lib/server/services/admin/authorize'

export const ADMIN_GENERATION_SCOPE_COOKIE = 'admin-generation-scope'
export const ADMIN_GENERATION_SCOPE_ALL = 'all'

export type AdminGenerationOption = {
  id: number
  name: string
}

export type AdminGenerationScope =
  | {
      kind: 'generation'
      generationId: number
    }
  | {
      kind: 'all'
    }

export type ResolvedAdminGenerationScope = {
  canAccessAll: boolean
  options: AdminGenerationOption[]
  scope: AdminGenerationScope | null
  selectedGeneration: AdminGenerationOption | null
}

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

function getCookieFromHeader(
  cookieHeader: string | null,
  cookieName: string
): string | undefined {
  if (!cookieHeader) {
    return undefined
  }

  const encodedCookieName = `${cookieName}=`
  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(encodedCookieName))

  if (!cookie) {
    return undefined
  }

  return decodeURIComponent(cookie.slice(encodedCookieName.length))
}

async function loadAccessibleGenerationOptions(
  userId: string,
  role: Awaited<ReturnType<typeof getUserRole>>
): Promise<AdminGenerationOption[]> {
  return loadAccessibleGenerations({ userId, role })
}

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

// 요청 단위 메모이즈: 같은 요청 안의 모든 호출이 같은 scope 객체를 받아
// 아래 fetcher 들의 cache() 가 객체 동일성으로 쿼리를 디듀프할 수 있다.
export const resolveAdminGenerationScope = cache(async function (
  userId: string
): Promise<ResolvedAdminGenerationScope> {
  const role = await getUserRole(userId)
  const canAccessAll = role === 'LEAD'
  const options = await loadAccessibleGenerationOptions(userId, role)

  if (options.length === 0) {
    return { canAccessAll, options, scope: null, selectedGeneration: null }
  }

  const headerStore = await headers()
  const scope = resolveScopeFromOptions(
    options,
    canAccessAll,
    getCookieFromHeader(
      headerStore.get('cookie'),
      ADMIN_GENERATION_SCOPE_COOKIE
    )
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
