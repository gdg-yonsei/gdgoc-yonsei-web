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
    return {
      canAccessAll,
      options,
      scope: null,
      selectedGeneration: null,
    }
  }

  const headerStore = await headers()
  const requestedScope = parseRequestedGenerationScope(
    getCookieFromHeader(
      headerStore.get('cookie'),
      ADMIN_GENERATION_SCOPE_COOKIE
    ),
    options,
    canAccessAll
  )

  if (requestedScope?.kind === 'all') {
    return {
      canAccessAll,
      options,
      scope: requestedScope,
      selectedGeneration: null,
    }
  }

  if (requestedScope?.kind === 'generation') {
    const selectedGeneration =
      options.find((option) => option.id === requestedScope.generationId) ??
      null

    return {
      canAccessAll,
      options,
      scope: requestedScope,
      selectedGeneration,
    }
  }

  const fallback = options[0] ?? null

  return {
    canAccessAll,
    options,
    scope: fallback
      ? {
          kind: 'generation',
          generationId: fallback.id,
        }
      : null,
    selectedGeneration: fallback,
  }
})

export async function normalizeAdminGenerationScopeValueForUser(
  userId: string,
  requestedValue: string
): Promise<string | null> {
  const role = await getUserRole(userId)
  const canAccessAll = role === 'LEAD'
  const options = await loadAccessibleGenerationOptions(userId, role)

  if (options.length === 0) {
    return null
  }

  const normalizedScope = parseRequestedGenerationScope(
    requestedValue,
    options,
    canAccessAll
  )

  if (normalizedScope) {
    return serializeAdminGenerationScope(normalizedScope)
  }

  return String(options[0]?.id ?? '')
}
