import 'server-only'

import db from '@/db'
import { mcpAuditLog } from '@/db/schema/mcp-audit-log'
import { logger } from '@/lib/server/logger'
import type { Actor, ServiceResult } from '@/lib/server/services/admin/types'

const MAX_STRING = 2048
const SECRET_KEY = /token|secret|password|authorization|signature/i

/** 감사 로그에 넣을 입력: 비밀성 키는 가리고 긴 문자열은 자른다. */
export function sanitizeAuditInput(value: unknown, key = ''): unknown {
  if (SECRET_KEY.test(key)) return '[redacted]'
  if (typeof value === 'string') {
    return value.length > MAX_STRING
      ? `${value.slice(0, MAX_STRING)}…[truncated]`
      : value
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

/**
 * 도구 실행 결과를 감사 로그에 남긴다. 실패한 호출도 기록하고,
 * 기록 자체가 실패해도 도구 결과는 그대로 돌려준다.
 */
export async function withAudit(
  actor: Actor,
  meta: {
    tool: string
    clientName?: string | null
    targetId?: (data: unknown) => string | undefined
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
      clientName: meta.clientName ?? null,
      tool: meta.tool,
      input: sanitizeAuditInput(input ?? {}),
      outcome: result.ok ? 'ok' : 'error',
      errorCode: result.ok ? null : result.code,
      targetId: result.ok ? (meta.targetId?.(result.data) ?? null) : null,
      durationMs: Date.now() - started,
    })
  } catch (error) {
    logger.error('mcp.audit', error, {
      tool: meta.tool,
      userId: actor.userId,
    })
  }

  return result
}
