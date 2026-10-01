import 'server-only'

import { getUserRole } from '@/lib/server/fetcher/admin/get-user-role'
import {
  SCOPES,
  type Actor,
  type Scope,
} from '@/lib/server/services/admin/types'

/** `requireMcpAuth` 가 검증을 마친 access token 클레임. */
export type AccessTokenClaims = Record<string, unknown>

/**
 * 검증된 토큰 클레임을 Actor 로 바꾼다.
 * 역할은 토큰에 넣지 않고 매 요청 DB 에서 읽는다 — 강등·삭제가 즉시 반영된다.
 * 사용자가 없거나 UNVERIFIED 면 null(= 401).
 */
export async function actorFromClaims(
  claims: AccessTokenClaims
): Promise<Actor | null> {
  const userId = typeof claims.sub === 'string' ? claims.sub : null
  if (!userId) return null

  const role = await getUserRole(userId)
  if (role === 'UNVERIFIED') return null

  const granted =
    typeof claims.scope === 'string' ? claims.scope.split(' ') : []
  const scopes = SCOPES.filter((scope): scope is Scope =>
    granted.includes(scope)
  )
  const clientId =
    typeof claims.azp === 'string'
      ? claims.azp
      : typeof claims.client_id === 'string'
        ? claims.client_id
        : undefined

  return {
    userId,
    role,
    scopes,
    via: 'mcp',
    ...(clientId ? { clientId } : {}),
  }
}
