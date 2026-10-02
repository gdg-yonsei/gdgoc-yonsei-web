/**
 * MCP 목록 도구용 기수 범위 해석. 규칙은 웹 쿠키 해석(`admin-generation-scope.ts`)과 같다.
 */
import 'server-only'

import {
  resolveScopeFromOptions,
  type AdminGenerationScope,
} from '@/lib/server/admin-generation-scope'
import { loadAccessibleGenerations } from '@/lib/server/services/admin/authorize'
import {
  fail,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'

/**
 * 요청된 기수(또는 'all')를 사용자의 접근 가능 기수에 맞춰 해석한다.
 * 규칙은 웹 쿠키 해석과 같다: LEAD 만 'all' 가능, 없는/권한 밖 값은 최신 접근 기수로 대체.
 */
export async function resolveGenerationScope(
  actor: Pick<Actor, 'userId' | 'role'>,
  requested?: number | 'all'
): Promise<AdminGenerationScope | null> {
  const options = await loadAccessibleGenerations(actor)
  return resolveScopeFromOptions(
    options,
    actor.role === 'LEAD',
    requested === undefined ? undefined : String(requested)
  )
}

/**
 * MCP 목록 도구용: 명시적으로 요청한 기수가 권한 밖이면 다른 기수로 조용히 바꾸지 않고
 * FORBIDDEN 을 돌려준다. 아무것도 요청하지 않으면 기본 규칙(최신 접근 기수)을 쓴다.
 */
export async function resolveRequestedGenerationScope(
  actor: Pick<Actor, 'userId' | 'role'>,
  requested?: number | 'all'
): Promise<ServiceResult<AdminGenerationScope | null>> {
  if (requested === 'all' && actor.role !== 'LEAD') {
    return fail('FORBIDDEN', 'Only a LEAD can list every generation.')
  }
  if (typeof requested === 'number') {
    const accessible = await loadAccessibleGenerations(actor)
    if (!accessible.some((generation) => generation.id === requested)) {
      return fail(
        'FORBIDDEN',
        'You cannot access this generation. Use whoami to see yours.'
      )
    }
  }
  return ok(await resolveGenerationScope(actor, requested))
}
