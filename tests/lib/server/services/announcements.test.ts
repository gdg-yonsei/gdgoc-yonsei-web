import { beforeEach, describe, expect, it, vi } from 'vitest'

const { findAnnouncement, dbTransaction, dbDelete, dbInsert } = vi.hoisted(
  () => ({
    findAnnouncement: vi.fn(),
    dbTransaction: vi.fn(),
    dbDelete: vi.fn(),
    dbInsert: vi.fn(),
  })
)

vi.mock('@/db', () => ({
  db: {
    query: { announcements: { findFirst: findAnnouncement } },
    transaction: dbTransaction,
    delete: dbDelete,
    insert: dbInsert,
  },
}))

import {
  createAnnouncement,
  deleteAnnouncement,
  markAnnouncementRead,
} from '@/lib/server/services/admin/announcements'
import type { Actor } from '@/lib/server/services/admin/types'

function webActor(role: Actor['role']): Actor {
  return { userId: `user-${role}`, role, scopes: 'session', via: 'web' }
}

const ANNOUNCEMENT_ID = '5b0c6a52-7f1e-4c39-9d2a-6e1f3c8b4a01'
const validInput = {
  title: 'GYMS MCP',
  body: 'Connect GYMS to your AI tool.',
  ctaLabel: 'Open guide',
  ctaHref: '/admin/mcp',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('announcements service', () => {
  it.each(['MEMBER', 'CORE', 'ALUMNUS'] as const)(
    'forbids %s from creating or deleting announcements',
    async (role) => {
      const actor = webActor(role)
      await expect(
        createAnnouncement(actor, validInput)
      ).resolves.toMatchObject({ ok: false, code: 'FORBIDDEN' })
      await expect(
        deleteAnnouncement(actor, ANNOUNCEMENT_ID)
      ).resolves.toMatchObject({ ok: false, code: 'FORBIDDEN' })
      expect(dbTransaction).not.toHaveBeenCalled()
      expect(dbDelete).not.toHaveBeenCalled()
    }
  )

  it('stores a LEAD announcement and marks it read for the author', async () => {
    const values = vi.fn()
    const tx = {
      insert: vi.fn(() => ({
        values: (row: unknown) => {
          values(row)
          return { returning: async () => [{ id: ANNOUNCEMENT_ID }] }
        },
      })),
    }
    dbTransaction.mockImplementation(async (work) => work(tx))

    await expect(
      createAnnouncement(webActor('LEAD'), validInput)
    ).resolves.toEqual({ ok: true, data: { id: ANNOUNCEMENT_ID } })
    expect(values).toHaveBeenNthCalledWith(1, {
      ...validInput,
      authorId: 'user-LEAD',
    })
    expect(values).toHaveBeenNthCalledWith(2, {
      announcementId: ANNOUNCEMENT_ID,
      userId: 'user-LEAD',
    })
  })

  it('rejects an external button link before touching the database', async () => {
    await expect(
      createAnnouncement(webActor('LEAD'), {
        ...validInput,
        ctaHref: 'https://evil.example',
      })
    ).resolves.toMatchObject({ ok: false, code: 'VALIDATION' })
    expect(dbTransaction).not.toHaveBeenCalled()
  })

  it('returns NOT_FOUND when marking a malformed id as read', async () => {
    await expect(
      markAnnouncementRead(webActor('MEMBER'), 'not-a-uuid')
    ).resolves.toMatchObject({ ok: false, code: 'NOT_FOUND' })
    expect(dbInsert).not.toHaveBeenCalled()
  })

  it('does not let UNVERIFIED users record reads', async () => {
    await expect(
      markAnnouncementRead(webActor('UNVERIFIED'), ANNOUNCEMENT_ID)
    ).resolves.toMatchObject({ ok: false, code: 'FORBIDDEN' })
    expect(dbInsert).not.toHaveBeenCalled()
  })

  it('records a read for any verified member', async () => {
    findAnnouncement.mockResolvedValue({ id: ANNOUNCEMENT_ID })
    const onConflictDoNothing = vi.fn().mockResolvedValue(undefined)
    const values = vi.fn(() => ({ onConflictDoNothing }))
    dbInsert.mockReturnValue({ values })

    await expect(
      markAnnouncementRead(webActor('ALUMNUS'), ANNOUNCEMENT_ID)
    ).resolves.toEqual({ ok: true, data: null })
    expect(values).toHaveBeenCalledWith({
      announcementId: ANNOUNCEMENT_ID,
      userId: 'user-ALUMNUS',
    })
    expect(onConflictDoNothing).toHaveBeenCalled()
  })
})
