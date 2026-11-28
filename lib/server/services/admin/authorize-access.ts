// 서비스가 데이터에 접근하기 전에 부르는 단일 권한 진입점이다.
// 스코프 → 정책 표의 규칙 → 규칙이 요구하는 사실(소유자, 기수)을 한 번에 판정한다.
// 규칙이 기수를 요구하는데 기수를 넘기지 않았거나 접근할 수 없는 기수면 거부한다.
import 'server-only'

import {
  evaluateRule,
  ruleFor,
  ruleNeedsGeneration,
  type ActionType,
  type ResourceType,
} from '@/lib/server/permission/policy'
import {
  ROLE_DENIED,
  SCOPE_DENIED,
  canAccessGeneration,
  hasScope,
  requiredScopeFor,
} from '@/lib/server/services/admin/authorize'
import {
  fail,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'

export type AccessTarget = {
  /** 데이터 소유자(작성자·본인) ID. `own` 규칙에 쓴다. */
  ownerId?: string | null | undefined
  /** 대상 데이터가 속한 기수. 기수 범위 규칙에 쓴다. */
  generationId?: number | null | undefined
  /**
   * 기수 소속을 호출자가 이미 판정했을 때 넘긴다(예: 멤버끼리 같은 기수인지).
   * 넘기면 `generationId` 조회를 대신한다.
   */
  inGeneration?: boolean | undefined
  /** 기수 범위 밖이라 거부할 때의 안내 문구. */
  generationDenied?: string
}

const GENERATION_DENIED = 'You cannot manage data of this generation.'

/**
 * 스코프·역할·소유자·기수 범위를 모두 확인한다. 하나라도 부족하면 FORBIDDEN이다.
 * LEAD는 표에서 `true`라 기수 조회 없이 통과한다.
 */
export async function authorizeAccess(
  actor: Actor,
  action: ActionType,
  resource: ResourceType,
  target: AccessTarget = {}
): Promise<ServiceResult<void>> {
  if (!hasScope(actor, requiredScopeFor(action, resource))) {
    return fail('FORBIDDEN', SCOPE_DENIED)
  }

  const rule = ruleFor(actor.role, action, resource)
  if (rule === undefined) return fail('FORBIDDEN', ROLE_DENIED)

  const isOwner = Boolean(target.ownerId) && target.ownerId === actor.userId
  // 소유자·무조건 규칙으로 이미 허용되면 기수를 조회하지 않는다.
  if (evaluateRule(rule, { isOwner })) return ok(undefined)
  if (!ruleNeedsGeneration(rule)) return fail('FORBIDDEN', ROLE_DENIED)

  const inGeneration =
    target.inGeneration ??
    (await canAccessGeneration(actor, target.generationId))
  return evaluateRule(rule, { isOwner, inGeneration })
    ? ok(undefined)
    : fail('FORBIDDEN', target.generationDenied ?? GENERATION_DENIED)
}
