import { beforeEach, describe, expect, it, vi } from 'vitest'

const { deleted, updates, transaction, selectCodes, deleteWhere, deleteTable } =
  vi.hoisted(() => {
    const deleted = vi.fn()
    const updates: Record<string, unknown>[] = []
    const selectCodes = vi.fn()
    const deleteWhere = vi.fn()
    const deleteTable = vi.fn(() => ({ where: deleteWhere }))
    const tx = {
      select: () => ({ from: selectCodes }),
      delete: deleteTable,
      update: () => ({
        set: (values: Record<string, unknown>) => {
          updates.push(values)
          return { where: async () => undefined }
        },
      }),
    }
    const transaction = vi.fn(
      async (work: (client: typeof tx) => Promise<unknown>) => work(tx)
    )
    return {
      deleted,
      updates,
      transaction,
      selectCodes,
      deleteWhere,
      deleteTable,
    }
  })

vi.mock('@/db', () => ({ db: { transaction } }))

import {
  listMcpAuditLog,
  revokeMcpConnection,
} from '@/lib/server/services/admin/mcp-connections'
import { PgDialect } from 'drizzle-orm/pg-core'
import { verification } from '@/db/schema/verification-tokens'
import type { Actor } from '@/lib/server/services/admin/types'

const member: Actor = {
  userId: 'me',
  role: 'MEMBER',
  scopes: 'session',
  via: 'web',
}

beforeEach(() => {
  vi.clearAllMocks()
  updates.length = 0
  selectCodes.mockResolvedValue([])
  deleteWhere.mockReturnValue({ returning: deleted })
})

describe('revokeMcpConnection', () => {
  it('removes all outstanding codes for only this user and client, preserving other verification records', async () => {
    deleted.mockResolvedValue([{ id: 'consent-1' }])
    const code = (userId: string, clientId: string) =>
      JSON.stringify({
        type: 'authorization_code',
        userId,
        query: { client_id: clientId },
      })
    selectCodes.mockResolvedValue([
      { id: 'code-1', value: code('me', 'client-1') },
      {
        id: 'code-2',
        value:
          ' { "type": "authorization_code", "userId": "me", "query": { "client_id": "client-1" } } ',
      },
      { id: 'other-user', value: code('other', 'client-1') },
      { id: 'other-client', value: code('me', 'client-2') },
      { id: 'opaque', value: 'email-verification-token' },
      { id: 'json-null', value: 'null' },
      {
        id: 'other-purpose',
        value: JSON.stringify({
          type: 'oauth_state',
          userId: 'me',
          query: { client_id: 'client-1' },
        }),
      },
    ])
    expect(await revokeMcpConnection(member, 'client-1')).toMatchObject({
      ok: true,
    })
    expect(deleteTable).toHaveBeenCalledWith(verification)
    const condition = deleteWhere.mock.calls[1]![0]
    expect(new PgDialect().sqlToQuery(condition).params).toEqual([
      'code-1',
      'code-2',
    ])
  })

  it('deletes the consent and revokes refresh and access tokens', async () => {
    deleted.mockResolvedValue([{ id: 'consent-1' }])

    await expect(revokeMcpConnection(member, 'client-1')).resolves.toEqual({
      ok: true,
      data: { clientId: 'client-1' },
    })
    expect(transaction).toHaveBeenCalledTimes(1)
    expect(updates).toHaveLength(2)
    for (const values of updates) {
      expect(values.revoked).toBeInstanceOf(Date)
    }
  })

  it('reports a connection that is already gone without touching tokens', async () => {
    deleted.mockResolvedValue([])

    await expect(
      revokeMcpConnection(member, 'client-1')
    ).resolves.toMatchObject({ ok: false, code: 'NOT_FOUND' })
    expect(updates).toHaveLength(0)
  })

  it('rejects an empty client id', async () => {
    await expect(revokeMcpConnection(member, ' ')).resolves.toMatchObject({
      ok: false,
      code: 'VALIDATION',
    })
    expect(transaction).not.toHaveBeenCalled()
  })
})

describe('listMcpAuditLog', () => {
  it('lets only LEAD read every member’s audit log', async () => {
    await expect(
      listMcpAuditLog(member, { allUsers: true })
    ).resolves.toMatchObject({ ok: false, code: 'FORBIDDEN' })
  })
})
