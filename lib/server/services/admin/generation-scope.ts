// MCP 목록의 기본 기수 범위 규칙은 웹 쿠키 해석과 같다.
import 'server-only'

import {
  resolveScopeFromOptions,
  type AdminGenerationScope,
} from '@/lib/admin/generation-scope'
import { loadAccessibleGenerations } from '@/lib/server/services/admin/authorize'
import {
  fail,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'

// all은 LEAD 전용이다. 값이 없거나 권한 밖이면 접근 가능한 최신 기수로 대체한다.
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

// MCP가 명시한 기수가 권한 밖이면 FORBIDDEN이다. 미지정 시에는 접근 가능한 최신 기수를 쓴다.
export async function resolveRequestedGenerationScope(
  actor: Pick<Actor, 'userId' | 'role'>,
  requested?: number | 'all'
): Promise<ServiceResult<AdminGenerationScope | null>> {
  if (requested === 'all' && actor.role !== 'LEAD') {
    return fail('FORBIDDEN', 'Only a LEAD can list every generation.')
  }
  const accessible = await loadAccessibleGenerations(actor)
  if (typeof requested === 'number') {
    if (!accessible.some((generation) => generation.id === requested)) {
      return fail(
        'FORBIDDEN',
        'You cannot access this generation. Use whoami to see yours.'
      )
    }
  }
  return ok(
    resolveScopeFromOptions(
      accessible,
      actor.role === 'LEAD',
      requested === undefined ? undefined : String(requested)
    )
  )
}
