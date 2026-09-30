import { beforeEach, describe, expect, it, vi } from 'vitest'

const { insertValues, insert, findClient, deleteWhere, dbDelete } = vi.hoisted(
  () => {
    const insertValues = vi.fn()
    const deleteWhere = vi.fn(async () => undefined)
    return {
      insertValues,
      insert: vi.fn(() => ({ values: insertValues })),
      findClient: vi.fn(),
      deleteWhere,
      dbDelete: vi.fn(() => ({ where: deleteWhere })),
    }
  }
)
vi.mock('@/db', () => ({
  default: {
    insert,
    delete: dbDelete,
    query: { oauthClient: { findFirst: findClient } },
  },
}))

import { pruneAuditLog, sanitizeAuditInput, withAudit } from '@/lib/mcp/audit'
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
    findClient.mockReset()
    findClient.mockResolvedValue({ name: 'Claude' })
  })

  it('records the OAuth client name', async () => {
    await withAudit(actor, { tool: 'update_session' }, {}, async () => ({
      ok: true,
      data: null,
    }))
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ clientName: 'Claude' })
    )
  })

  it('records the target of a failed call from its input', async () => {
    await withAudit(
      actor,
      { tool: 'delete_session' },
      { sessionId: 's9' },
      async () => ({
        ok: false,
        code: 'FORBIDDEN',
        message: 'no',
      })
    )
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'error', targetId: 's9' })
    )
  })

  it('records a successful call with its target id', async () => {
    const result = await withAudit(
      actor,
      {
        tool: 'create_session',
        targetId: (data) => (data as { id: string }).id,
      },
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
    await withAudit(
      actor,
      { tool: 'delete_session' },
      { sessionId: 's' },
      async () => ({
        ok: false,
        code: 'FORBIDDEN',
        message: 'no',
      })
    )
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: 'error',
        errorCode: 'FORBIDDEN',
        targetId: 's',
      })
    )
  })

  it('returns the tool result even when the audit insert fails', async () => {
    insertValues.mockRejectedValue(new Error('db down'))
    await expect(
      withAudit(actor, { tool: 'update_session' }, {}, async () => ({
        ok: true,
        data: 1,
      }))
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
    }) as {
      nested: { accessToken: string; text: string }
      list: Array<{ password: string }>
    }
    expect(sanitized.nested.accessToken).toBe('[redacted]')
    expect(sanitized.list[0]?.password).toBe('[redacted]')
    expect(sanitized.nested.text.length).toBeLessThan(2100)
    expect(sanitized.nested.text.endsWith('…[truncated]')).toBe(true)
  })
})

describe('sanitizeAuditInput privacy', () => {
  it('drops query strings from URLs and redacts contact details', () => {
    expect(
      sanitizeAuditInput({
        url: 'https://example.com/a.png?X-Amz-Signature=abc&token=t#frag',
        email: 'x@x.com',
        telephone: '010',
        studentId: '2026',
        name: 'Kept',
      })
    ).toEqual({
      url: 'https://example.com/a.png',
      email: '[redacted]',
      telephone: '[redacted]',
      studentId: '[redacted]',
      name: 'Kept',
    })
  })
})

describe('pruneAuditLog', () => {
  it('deletes year-old rows at most once an hour', async () => {
    const start = Date.UTC(2099, 0, 1)
    dbDelete.mockClear()
    deleteWhere.mockClear()
    await pruneAuditLog(start)
    expect(deleteWhere).toHaveBeenCalledTimes(1)
    await pruneAuditLog(start + 10 * 60 * 1000)
    expect(dbDelete).toHaveBeenCalledTimes(1)
    await pruneAuditLog(start + 61 * 60 * 1000)
    expect(dbDelete).toHaveBeenCalledTimes(2)
  })
})
