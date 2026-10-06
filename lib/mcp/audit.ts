// 비밀값·연락처·URL 쿼리는 가리고 긴 입력은 자른다. 1년 지난 감사 기록은 시간마다 정리한다.
import 'server-only'

import { eq, lt } from 'drizzle-orm'
import { db } from '@/db'
import { mcpAuditLog } from '@/db/schema/mcp-audit-log'
import { oauthClient } from '@/db/schema/oauth'
import { logger } from '@/lib/server/logger'
import type { Actor, ServiceResult } from '@/lib/server/services/admin/types'

const MAX_STRING = 2048
const SECRET_KEY = /token|secret|password|authorization|signature/i
/** 연락처는 감사 목적에 필요 없고 기록이 오래 남으므로 값을 남기지 않는다. */
const PII_KEY = /^(email|telephone|studentId)$/
/** 실패한 호출도 대상을 알 수 있게 입력에서 찾는 ID 키. */
const TARGET_KEYS = [
  'sessionId',
  'projectId',
  'partId',
  'generationId',
  'memberId',
  'userId',
  'objectKey',
] as const
const RETENTION_MS = 365 * 24 * 60 * 60 * 1000
const PRUNE_INTERVAL_MS = 60 * 60 * 1000

const URL_IN_TEXT = /https?:\/\/[^\s"'<>()]+/gi

function stripQuery(value: string): string {
  try {
    const url = new URL(value)
    return `${url.origin}${url.pathname}`
  } catch {
    return value
  }
}

// 서명 URL의 쿼리 비밀값은 긴 텍스트 안에서도 제거한다. origin·path와 뒤 문장부호는 남긴다.
function withoutQuery(value: string): string {
  return value.replace(URL_IN_TEXT, (match) => {
    const trailing = match.match(/[.,;:!?]+$/)?.[0] ?? ''
    return stripQuery(match.slice(0, match.length - trailing.length)) + trailing
  })
}

/** 감사 로그에 넣을 입력: 비밀성 키는 가리고 긴 문자열은 자른다. */
export function sanitizeAuditInput(value: unknown, key = ''): unknown {
  if (SECRET_KEY.test(key) || PII_KEY.test(key)) return '[redacted]'
  if (typeof value === 'string') {
    const cleaned = withoutQuery(value)
    return cleaned.length > MAX_STRING
      ? `${cleaned.slice(0, MAX_STRING)}…[truncated]`
      : cleaned
  }
  if (Array.isArray(value)) return value.map((item) => sanitizeAuditInput(item))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        sanitizeAuditInput(entryValue, entryKey),
      ])
    )
  }
  return value ?? null
}

function targetFromInput(input: unknown): string | undefined {
  if (!input || typeof input !== 'object') return undefined
  const record = input as Record<string, unknown>
  for (const key of TARGET_KEYS) {
    const value = record[key]
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value)
    }
  }
  return undefined
}

async function clientNameOf(clientId: string | undefined) {
  if (!clientId) return null
  const client = await db.query.oauthClient.findFirst({
    where: eq(oauthClient.clientId, clientId),
    columns: { name: true },
  })
  return client?.name ?? null
}

let lastPrunedAt = 0

/** 1년 지난 감사 기록을 지운다. 프로세스마다 한 시간에 한 번만 실제로 지운다. */
export async function pruneAuditLog(now = Date.now()) {
  if (now - lastPrunedAt < PRUNE_INTERVAL_MS) return
  lastPrunedAt = now
  await db
    .delete(mcpAuditLog)
    .where(lt(mcpAuditLog.createdAt, new Date(now - RETENTION_MS)))
}

// 실패한 도구 호출도 감사 기록한다. 기록 실패가 도구 결과를 바꾸지는 않는다.
export async function withAudit(
  actor: Actor,
  meta: {
    tool: string
    clientName?: string | null
    targetId?: ((data: unknown) => string | undefined) | undefined
  },
  input: unknown,
  run: () => Promise<ServiceResult<unknown>>
): Promise<ServiceResult<unknown>> {
  const started = Date.now()
  const result = await run()

  try {
    await db.insert(mcpAuditLog).values({
      userId: actor.userId,
      role: actor.role,
      clientId: actor.clientId ?? null,
      clientName: meta.clientName ?? (await clientNameOf(actor.clientId)),
      tool: meta.tool,
      input: sanitizeAuditInput(input ?? {}),
      outcome: result.ok ? 'ok' : 'error',
      errorCode: result.ok ? null : result.code,
      targetId:
        (result.ok ? meta.targetId?.(result.data) : undefined) ??
        targetFromInput(input) ??
        null,
      durationMs: Date.now() - started,
    })
    await pruneAuditLog()
  } catch (error) {
    logger.error('mcp.audit', error, {
      tool: meta.tool,
      userId: actor.userId,
    })
  }

  return result
}
