import 'server-only'

import { cookies } from 'next/headers'
import { desc, eq } from 'drizzle-orm'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { usersToParts } from '@/db/schema/users-to-parts'
import getUserRole from '@/lib/server/fetcher/admin/get-user-role'

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

async function loadAccessibleGenerationOptions(
  userId: string,
  canAccessAll: boolean
): Promise<AdminGenerationOption[]> {
  if (canAccessAll) {
    return db
      .select({
        id: generations.id,
        name: generations.name,
      })
      .from(generations)
      .orderBy(desc(generations.id))
  }

  return db
    .selectDistinct({
      id: generations.id,
      name: generations.name,
    })
    .from(usersToParts)
    .innerJoin(parts, eq(usersToParts.partId, parts.id))
    .innerJoin(generations, eq(parts.generationsId, generations.id))
    .where(eq(usersToParts.userId, userId))
    .orderBy(desc(generations.id))
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

export async function resolveAdminGenerationScope(
  userId: string
): Promise<ResolvedAdminGenerationScope> {
  const role = await getUserRole(userId)
  const canAccessAll = role === 'LEAD'
  const options = await loadAccessibleGenerationOptions(userId, canAccessAll)

  if (options.length === 0) {
    return {
      canAccessAll,
      options,
      scope: null,
      selectedGeneration: null,
    }
  }

  const cookieStore = await cookies()
  const requestedScope = parseRequestedGenerationScope(
    cookieStore.get(ADMIN_GENERATION_SCOPE_COOKIE)?.value,
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
      options.find((option) => option.id === requestedScope.generationId) ?? null

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
}

export async function normalizeAdminGenerationScopeValueForUser(
  userId: string,
  requestedValue: string
): Promise<string | null> {
  const role = await getUserRole(userId)
  const canAccessAll = role === 'LEAD'
  const options = await loadAccessibleGenerationOptions(userId, canAccessAll)

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
