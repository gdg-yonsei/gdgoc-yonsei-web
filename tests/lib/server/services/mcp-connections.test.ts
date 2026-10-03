import { beforeEach, describe, expect, it, vi } from 'vitest'

const { deleted, updates, transaction } = vi.hoisted(() => {
  const deleted = vi.fn()
  const updates: Record<string, unknown>[] = []
  const tx = {
    delete: () => ({ where: () => ({ returning: deleted }) }),
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
  return { deleted, updates, transaction }
})

vi.mock('@/db', () => ({ db: { transaction } }))

import {
  listMcpAuditLog,
  revokeMcpConnection,
} from '@/lib/server/services/admin/mcp-connections'
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
})

describe('revokeMcpConnection', () => {
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
