import { beforeEach, describe, expect, it, vi } from 'vitest'

const { insertValues, insert } = vi.hoisted(() => {
  const insertValues = vi.fn()
  return { insertValues, insert: vi.fn(() => ({ values: insertValues })) }
})
vi.mock('@/db', () => ({ default: { insert } }))

import { sanitizeAuditInput, withAudit } from '@/lib/mcp/audit'
import type { Actor } from '@/lib/server/services/admin/types'

const actor: Actor = {
  userId: 'u1',
  role: 'LEAD',
  scopes: ['gyms:read', 'gyms:write'],
  via: 'mcp',
  clientId: 'c1',
}

describe('withAudit', () => {
  beforeEach(() => {
    insert.mockClear()
    insertValues.mockReset()
    insertValues.mockResolvedValue(undefined)
  })

  it('records a successful call with its target id', async () => {
    const result = await withAudit(
      actor,
      { tool: 'create_session', targetId: (data) => (data as { id: string }).id },
      { name: 'x' },
      async () => ({ ok: true, data: { id: 's1' } })
    )
    expect(result).toEqual({ ok: true, data: { id: 's1' } })
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        role: 'LEAD',
        clientId: 'c1',
        tool: 'create_session',
        outcome: 'ok',
        errorCode: null,
        targetId: 's1',
        input: { name: 'x' },
      })
    )
  })

  it('records a failed call with its error code', async () => {
    await withAudit(actor, { tool: 'delete_session' }, { sessionId: 's' }, async () => ({
      ok: false,
      code: 'FORBIDDEN',
      message: 'no',
    }))
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'error', errorCode: 'FORBIDDEN', targetId: null })
    )
  })

  it('returns the tool result even when the audit insert fails', async () => {
    insertValues.mockRejectedValue(new Error('db down'))
    await expect(
      withAudit(actor, { tool: 'update_session' }, {}, async () => ({ ok: true, data: 1 }))
    ).resolves.toEqual({ ok: true, data: 1 })
  })
})

describe('sanitizeAuditInput', () => {
  it('redacts secret-like keys and truncates long strings', () => {
    const long = 'a'.repeat(3000)
    const sanitized = sanitizeAuditInput({
      uploadUrl: 'https://r2/x?X-Amz-Signature=abc',
      nested: { accessToken: 't', text: long },
      list: [{ password: 'p' }],
    }) as Record<string, any>
    expect(sanitized.nested.accessToken).toBe('[redacted]')
    expect(sanitized.list[0].password).toBe('[redacted]')
    expect(sanitized.nested.text.length).toBeLessThan(2100)
    expect(sanitized.nested.text.endsWith('…[truncated]')).toBe(true)
  })
})
