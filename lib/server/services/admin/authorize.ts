/**
 * 관리자 서비스 권한 판단.
 *
 * 역할 정책 표(`permission/policy.ts`)에 더해, MCP 토큰 스코프, 기수 단위 접근, 멤버 수정
 * 대상 제한 같은 서비스 계층 규칙을 함께 본다.
 */
import 'server-only'

import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { usersToParts } from '@/db/schema/users-to-parts'
import {
  isAllowed,
  type ActionType,
  type ResourceType,
} from '@/lib/server/permission/policy'
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

/** 역할 정책 표상 작업이 허용되는지. `ownerId`가 요청자와 같으면 본인 데이터 규칙이 적용된다. */
export function roleAllows(
  actor: Pick<Actor, 'userId' | 'role'>,
  action: ActionType,
  resource: ResourceType,
  ownerId?: string
): boolean {
  return isAllowed(actor.role, action, resource, {
    isOwner: actor.userId === ownerId,
  })
}

/** 소유권을 무시하고(본인 데이터라고 가정하고) 역할상 가능한지. 도구 목록 필터용. */
export function roleCouldEver(
  role: Role,
  action: ActionType,
  resource: ResourceType
): boolean {
  return isAllowed(role, action, resource, { isOwner: true })
}

/** Actor가 해당 스코프를 가졌는지. 웹 세션은 스코프 제한이 없다. */
export function hasScope(actor: Actor, scope: Scope): boolean {
  return actor.scopes === 'session' || actor.scopes.includes(scope)
}

/**
 * 스코프와 역할을 모두 확인한다. 둘 중 하나라도 부족하면 FORBIDDEN.
 *
 * @param ownerId - 데이터 소유자 ID(본인 데이터만 허용하는 규칙에 쓴다)
 */
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

/** 해당 기수의 데이터를 다룰 수 있는지. LEAD는 모든 기수, 그 외는 자신이 속한 기수만. */
export async function canAccessGeneration(
  actor: Pick<Actor, 'userId' | 'role'>,
  generationId: number | null | undefined
): Promise<boolean> {
  if (actor.role === 'LEAD') return true
  if (!generationId) return false
  const accessible = await loadAccessibleGenerations(actor)
  return accessible.some((generation) => generation.id === generationId)
}

/** CORE 가 고칠 수 있는 대상 역할. 자기와 같거나 높은 역할(CORE, LEAD)은 LEAD 만 고친다. */
const CORE_EDITABLE_ROLES: ReadonlySet<Role> = new Set([
  'MEMBER',
  'ALUMNUS',
  'UNVERIFIED',
])

/**
 * 멤버 정보를 고칠 수 있는지. 본인은 항상, LEAD 는 누구나,
 * CORE 는 낮은 역할의 멤버만. (역할 매트릭스의 `put members` 위에 얹는 대상 제한)
 */
export function canEditMember(
  actor: Pick<Actor, 'userId' | 'role'>,
  target: { id: string; role: Role }
): boolean {
  if (target.id === actor.userId) return true
  if (actor.role === 'LEAD') return true
  return actor.role === 'CORE' && CORE_EDITABLE_ROLES.has(target.role)
}

/**
 * 다른 사람의 이메일은 LEAD 만 바꾼다. 이메일로 소셜 계정을 연결하므로
 * 남의 이메일을 바꿀 수 있으면 그 계정을 가로챌 수 있다.
 */
export function canChangeMemberEmail(
  actor: Pick<Actor, 'userId' | 'role'>,
  targetId: string
): boolean {
  return targetId === actor.userId || actor.role === 'LEAD'
}

/**
 * 두 사람이 한 기수라도 함께 속해 있는지. 본인과 LEAD 는 항상 true.
 * 연락처(이메일·전화·학번) 공개와 CORE 의 멤버 수정 범위를 정한다.
 */
export async function sharesGenerationWith(
  actor: Pick<Actor, 'userId' | 'role'>,
  memberId: string
): Promise<boolean> {
  if (memberId === actor.userId || actor.role === 'LEAD') return true
  const [mine, theirs] = await Promise.all([
    loadAccessibleGenerations(actor),
    // 역할과 무관하게 소속 파트의 기수만 본다.
    loadAccessibleGenerations({ userId: memberId, role: 'MEMBER' }),
  ])
  const mineIds = new Set(mine.map((generation) => generation.id))
  return theirs.some((generation) => mineIds.has(generation.id))
}
