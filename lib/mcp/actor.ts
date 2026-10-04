/**
 * MCP 액세스 토큰 클레임을 서비스 Actor로 바꾼다(`app/api/mcp/route.ts`가 쓴다).
 */
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

/** `requireMcpAuth` 가 검증을 마친 access token 클레임. */
export type AccessTokenClaims = Record<string, unknown>

/** 사용자가 그 클라이언트에 준 동의가 아직 있는지. */
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

/**
 * 검증된 토큰 클레임을 Actor 로 바꾼다.
 * 역할은 토큰에 넣지 않고 매 요청 DB 에서 읽는다 — 강등·삭제가 즉시 반영된다.
 * 사용자가 그 클라이언트에 준 동의도 매 요청 확인한다 — 관리자 화면에서 연결을 끊으면
 * (`lib/server/services/admin/mcp-connections.ts`) 아직 만료되지 않은 JWT 도 바로 거절된다.
 * 사용자가 없거나 UNVERIFIED 거나 동의가 없으면 null(= 401).
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

  if (!clientId || !(await hasConsent(userId, clientId))) return null

  return {
    userId,
    role,
    scopes,
    via: 'mcp',
    clientId,
  }
}
