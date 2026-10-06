// 연결 해제는 동의·토큰을 폐기한다. 유효 JWT도 MCP가 요청마다 동의를 확인해 즉시 거절한다.
// 감사 로그는 본인 기록만 공개하며 LEAD는 모든 사용자의 기록을 볼 수 있다.
import 'server-only'

import { z } from 'zod'
import { and, desc, eq, inArray, isNull, max } from 'drizzle-orm'
import { db } from '@/db'
import { mcpAuditLog } from '@/db/schema/mcp-audit-log'
import {
  oauthAccessToken,
  oauthClient,
  oauthConsent,
  oauthRefreshToken,
} from '@/db/schema/oauth'
import { verification } from '@/db/schema/verification-tokens'
import { users } from '@/db/schema/users'
import { authorize } from '@/lib/server/services/admin/authorize'
import { withDbErrors } from '@/lib/server/services/admin/db-errors'
import {
  fail,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'

export const AUDIT_LOG_PAGE_SIZE = 50

// @better-auth/oauth-provider의 authorization_code verification 값에서 소유자만 읽는다.
const authorizationCodeOwner = z.object({
  type: z.literal('authorization_code'),
  userId: z.string(),
  query: z.object({ client_id: z.string() }),
})

export type McpConnection = {
  clientId: string
  name: string | null
  uri: string | null
  scopes: string[]
  connectedAt: Date
  /** 마지막으로 토큰을 받았거나 쓰기 도구를 호출한 시각. */
  lastUsedAt: Date | null
}

export type McpAuditEntry = {
  id: string
  createdAt: Date
  tool: string
  outcome: 'ok' | 'error'
  errorCode: string | null
  targetId: string | null
  clientId: string | null
  clientName: string | null
  /** 모든 사용자 기록을 볼 때만 채운다. */
  userName: string | null
}

function latest(a: Date | null | undefined, b: Date | null | undefined) {
  if (!a) return b ?? null
  if (!b) return a
  return a > b ? a : b
}

/** 로그인한 사용자가 연결한 MCP 클라이언트 목록(최근에 동의한 순). */
export async function listMcpConnections(
  actor: Actor
): Promise<ServiceResult<McpConnection[]>> {
  const authorization = authorize(actor, 'get', 'profilePage')
  if (!authorization.ok) return authorization

  return withDbErrors(
    'admin.mcp-connections.list',
    async () => {
      const consents = await db
        .select({
          clientId: oauthConsent.clientId,
          scopes: oauthConsent.scopes,
          createdAt: oauthConsent.createdAt,
          name: oauthClient.name,
          uri: oauthClient.uri,
        })
        .from(oauthConsent)
        .innerJoin(oauthClient, eq(oauthClient.clientId, oauthConsent.clientId))
        .where(eq(oauthConsent.userId, actor.userId))
        .orderBy(desc(oauthConsent.updatedAt))

      if (consents.length === 0) return ok([])

      const clientIds = consents.map((consent) => consent.clientId)
      const [tokenActivity, auditActivity] = await Promise.all([
        db
          .select({
            clientId: oauthRefreshToken.clientId,
            at: max(oauthRefreshToken.createdAt),
          })
          .from(oauthRefreshToken)
          .where(
            and(
              eq(oauthRefreshToken.userId, actor.userId),
              inArray(oauthRefreshToken.clientId, clientIds)
            )
          )
          .groupBy(oauthRefreshToken.clientId),
        db
          .select({
            clientId: mcpAuditLog.clientId,
            at: max(mcpAuditLog.createdAt),
          })
          .from(mcpAuditLog)
          .where(
            and(
              eq(mcpAuditLog.userId, actor.userId),
              inArray(mcpAuditLog.clientId, clientIds)
            )
          )
          .groupBy(mcpAuditLog.clientId),
      ])
      const lastToken = new Map(
        tokenActivity.map((row) => [row.clientId, row.at])
      )
      const lastAudit = new Map(
        auditActivity.map((row) => [row.clientId, row.at])
      )

      return ok(
        consents.map((consent) => ({
          clientId: consent.clientId,
          name: consent.name,
          uri: consent.uri,
          scopes: consent.scopes,
          connectedAt: consent.createdAt,
          lastUsedAt: latest(
            lastToken.get(consent.clientId),
            lastAudit.get(consent.clientId)
          ),
        }))
      )
    },
    { userId: actor.userId },
    'Could not load MCP connections'
  )
}

// 본인 연결의 동의·미폐기 토큰·미교환 인가 코드를 폐기한다. 다른 사용자 연결은 건드리지 않는다.
export async function revokeMcpConnection(
  actor: Actor,
  clientId: string
): Promise<ServiceResult<{ clientId: string }>> {
  const authorization = authorize(actor, 'get', 'profilePage')
  if (!authorization.ok) return authorization
  if (!clientId.trim()) return fail('VALIDATION', 'clientId is required')

  return withDbErrors(
    'admin.mcp-connections.revoke',
    () =>
      db.transaction(async (tx) => {
        const removed = await tx
          .delete(oauthConsent)
          .where(
            and(
              eq(oauthConsent.userId, actor.userId),
              eq(oauthConsent.clientId, clientId)
            )
          )
          .returning({ id: oauthConsent.id })
        if (removed.length === 0) {
          return fail('NOT_FOUND', 'This MCP connection no longer exists.')
        }

        // 인가 코드는 verification의 JSON이다. 비 JSON 값은 보존하고 코드 본문의 사용자·클라이언트로 범위를 확인한다.
        const values = await tx
          .select({ id: verification.id, value: verification.value })
          .from(verification)
        const codeIds = values
          .filter(({ value }) => {
            try {
              const parsed = authorizationCodeOwner.safeParse(JSON.parse(value))
              return (
                parsed.success &&
                parsed.data.userId === actor.userId &&
                parsed.data.query.client_id === clientId
              )
            } catch {
              return false
            }
          })
          .map(({ id }) => id)
        if (codeIds.length > 0) {
          await tx.delete(verification).where(inArray(verification.id, codeIds))
        }

        const now = new Date()
        await tx
          .update(oauthRefreshToken)
          .set({ revoked: now })
          .where(
            and(
              eq(oauthRefreshToken.userId, actor.userId),
              eq(oauthRefreshToken.clientId, clientId),
              isNull(oauthRefreshToken.revoked)
            )
          )
        await tx
          .update(oauthAccessToken)
          .set({ revoked: now })
          .where(
            and(
              eq(oauthAccessToken.userId, actor.userId),
              eq(oauthAccessToken.clientId, clientId),
              isNull(oauthAccessToken.revoked)
            )
          )

        return ok({ clientId })
      }),
    { userId: actor.userId, clientId },
    'Could not disconnect the MCP client'
  )
}

// 감사 로그 전체 사용자 조회는 LEAD 전용이다. 다른 역할의 allUsers 요청은 403이다.
export async function listMcpAuditLog(
  actor: Actor,
  options: { allUsers?: boolean } = {}
): Promise<ServiceResult<McpAuditEntry[]>> {
  const authorization = authorize(actor, 'get', 'profilePage')
  if (!authorization.ok) return authorization
  if (options.allUsers && actor.role !== 'LEAD') {
    return fail('FORBIDDEN', 'Only LEAD can view every MCP audit entry.')
  }

  return withDbErrors(
    'admin.mcp-connections.audit',
    async () => {
      const rows = await db
        .select({
          id: mcpAuditLog.id,
          createdAt: mcpAuditLog.createdAt,
          tool: mcpAuditLog.tool,
          outcome: mcpAuditLog.outcome,
          errorCode: mcpAuditLog.errorCode,
          targetId: mcpAuditLog.targetId,
          clientId: mcpAuditLog.clientId,
          clientName: mcpAuditLog.clientName,
          userName: users.name,
        })
        .from(mcpAuditLog)
        .leftJoin(users, eq(users.id, mcpAuditLog.userId))
        .where(
          options.allUsers ? undefined : eq(mcpAuditLog.userId, actor.userId)
        )
        .orderBy(desc(mcpAuditLog.createdAt))
        .limit(AUDIT_LOG_PAGE_SIZE)

      return ok(
        rows.map((row) => ({
          ...row,
          userName: options.allUsers ? row.userName : null,
        }))
      )
    },
    { userId: actor.userId, allUsers: Boolean(options.allUsers) },
    'Could not load the MCP audit log'
  )
}
