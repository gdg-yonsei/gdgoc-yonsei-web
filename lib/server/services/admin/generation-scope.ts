import 'server-only'

import type { AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { loadAccessibleGenerations } from '@/lib/server/services/admin/authorize'
import type { Actor } from '@/lib/server/services/admin/types'

/**
 * 요청된 기수(또는 'all')를 사용자의 접근 가능 기수에 맞춰 해석한다.
 * 규칙은 웹 쿠키 해석과 같다: LEAD 만 'all' 가능, 없는/권한 밖 값은 최신 접근 기수로 대체.
 */
export async function resolveGenerationScope(
  actor: Pick<Actor, 'userId' | 'role'>,
  requested?: number | 'all'
): Promise<AdminGenerationScope | null> {
  const options = await loadAccessibleGenerations(actor)
  if (options.length === 0) return null

  if (requested === 'all' && actor.role === 'LEAD') return { kind: 'all' }
  if (typeof requested === 'number') {
    const matched = options.find((option) => option.id === requested)
    if (matched) return { kind: 'generation', generationId: matched.id }
  }

  const fallback = options[0]
  return fallback ? { kind: 'generation', generationId: fallback.id } : null
}
