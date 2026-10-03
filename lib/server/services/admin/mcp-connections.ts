/**
 * MCP 연결 관리 서비스(관리자 화면 `/admin/profile/mcp`).
 *
 * 사용자가 동의 화면에서 허락한 MCP 클라이언트(Claude, Codex, Cursor …) 목록을 보여 주고 연결을 끊는다.
 * 연결을 끊으면 동의 기록을 지우고 그 클라이언트의 리프레시·액세스 토큰을 폐기한다. 액세스 토큰은 JWT라
 * 서명만으로는 계속 유효하지만, MCP 라우트가 요청마다 동의 기록을 확인하므로(`lib/mcp/actor.ts`) 다음
 * 요청부터 바로 거절된다. 감사 로그는 본인 기록을, LEAD는 모든 사용자의 기록을 볼 수 있다.
 */
import 'server-only'

import { and, desc, eq, inArray, isNull, max } from 'drizzle-orm'
import { db } from '@/db'
import { mcpAuditLog } from '@/db/schema/mcp-audit-log'
import {
  oauthAccessToken,
  oauthClient,
  oauthConsent,
  oauthRefreshToken,
} from '@/db/schema/oauth'
import { users } from '@/db/schema/users'
import { authorize } from '@/lib/server/services/admin/authorize'
import { withDbErrors } from '@/lib/server/services/admin/db-errors'
import {
  fail,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'

/** 감사 로그 화면에 보여 줄 최근 기록 수. */
export const AUDIT_LOG_PAGE_SIZE = 50

/** 연결된 MCP 클라이언트 하나. */
export type McpConnection = {
  clientId: string
  /** 클라이언트가 등록할 때 밝힌 이름(없으면 `null`). */
  name: string | null
  uri: string | null
  /** 사용자가 허락한 스코프. */
  scopes: string[]
  /** 처음 동의한 시각. */
  connectedAt: Date
  /** 마지막으로 토큰을 받았거나 쓰기 도구를 호출한 시각. */
  lastUsedAt: Date | null
}

/** 감사 로그 한 줄. */
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

/** 둘 중 늦은 시각. */
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

/**
 * 로그인한 사용자의 MCP 연결 하나를 끊는다: 동의 기록을 지우고, 아직 폐기되지 않은 리프레시·액세스
 * 토큰을 폐기한다. 다른 사용자의 연결은 건드리지 않는다.
 */
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

/**
 * 최근 MCP 감사 로그. 기본은 본인 기록이고, `allUsers`는 LEAD만 쓸 수 있다(다른 역할이 요청하면 403).
 */
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
