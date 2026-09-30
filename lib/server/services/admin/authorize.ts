import 'server-only'

import { desc, eq } from 'drizzle-orm'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { usersToParts } from '@/db/schema/users-to-parts'
import checkPermission from '@/lib/server/permission/check-permission'
import type {
  ActionType,
  ResourceType,
} from '@/lib/server/permission/handle-permission'
import {
  fail,
  ok,
  type Actor,
  type Role,
  type Scope,
  type ServiceResult,
} from '@/lib/server/services/admin/types'

/** 작업 종류에 필요한 OAuth 스코프. 삭제와 역할 변경은 가장 높은 권한이다. */
export function requiredScopeFor(
  action: ActionType,
  resource: ResourceType
): Scope {
  if (resource === 'membersRole' || action === 'delete') return 'gyms:admin'
  if (action === 'get') return 'gyms:read'
  return 'gyms:write'
}

export function roleAllows(
  actor: Pick<Actor, 'userId' | 'role'>,
  action: ActionType,
  resource: ResourceType,
  ownerId?: string
): boolean {
  return (
    checkPermission(actor.userId, ownerId)[actor.role]?.[action]?.[resource] ??
    false
  )
}

/** 소유권을 무시하고(본인 데이터라고 가정하고) 역할상 가능한지. 도구 목록 필터용. */
export function roleCouldEver(
  role: Role,
  action: ActionType,
  resource: ResourceType
): boolean {
  return checkPermission('self', 'self')[role]?.[action]?.[resource] ?? false
}

export function hasScope(actor: Actor, scope: Scope): boolean {
  return actor.scopes === 'session' || actor.scopes.includes(scope)
}

export function authorize(
  actor: Actor,
  action: ActionType,
  resource: ResourceType,
  ownerId?: string
): ServiceResult<void> {
  if (!hasScope(actor, requiredScopeFor(action, resource))) {
    return fail('FORBIDDEN', 'The access token does not grant this operation.')
  }
  if (!roleAllows(actor, action, resource, ownerId)) {
    return fail('FORBIDDEN', 'You do not have permission for this operation.')
  }
  return ok(undefined)
}

/** LEAD 는 전 기수, 그 외는 자신이 속한 파트의 기수만 접근할 수 있다. */
export async function loadAccessibleGenerations(
  actor: Pick<Actor, 'userId' | 'role'>
): Promise<{ id: number; name: string }[]> {
  if (actor.role === 'LEAD') {
    return db
      .select({ id: generations.id, name: generations.name })
      .from(generations)
      .orderBy(desc(generations.id))
  }

  return db
    .selectDistinct({ id: generations.id, name: generations.name })
    .from(usersToParts)
    .innerJoin(parts, eq(usersToParts.partId, parts.id))
    .innerJoin(generations, eq(parts.generationsId, generations.id))
    .where(eq(usersToParts.userId, actor.userId))
    .orderBy(desc(generations.id))
}

export async function canAccessGeneration(
  actor: Pick<Actor, 'userId' | 'role'>,
  generationId: number | null | undefined
): Promise<boolean> {
  if (actor.role === 'LEAD') return true
  if (!generationId) return false
  const accessible = await loadAccessibleGenerations(actor)
  return accessible.some((generation) => generation.id === generationId)
}
