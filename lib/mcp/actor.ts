import 'server-only'

import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { oauthConsent } from '@/db/schema/oauth'
import { getUserRole } from '@/lib/server/fetcher/admin/get-user-role'
import {
  SCOPES,
  type Actor,
  type Scope,
} from '@/lib/server/services/admin/types'

export type AccessTokenClaims = Record<string, unknown>

async function hasConsent(userId: string, clientId: string) {
  const consent = await db
    .select({ id: oauthConsent.id })
    .from(oauthConsent)
    .where(
      and(eq(oauthConsent.userId, userId), eq(oauthConsent.clientId, clientId))
    )
    .limit(1)
  return consent.length > 0
}

// 매 요청 DB 역할·동의를 확인해 강등·삭제·연결 해제를 미만료 JWT에도 반영한다.
// 사용자 없음·UNVERIFIED·동의 없음은 null(401)이다.
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

  if (!clientId || !(await hasConsent(userId, clientId))) return null

  return {
    userId,
    role,
    scopes,
    via: 'mcp',
    clientId,
  }
}
