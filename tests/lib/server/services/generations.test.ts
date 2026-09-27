import { beforeEach, describe, expect, it, vi } from 'vitest'

const { loadAccessibleGenerations, dbInsert, getGenerations } = vi.hoisted(
  () => ({
    loadAccessibleGenerations: vi.fn(),
    dbInsert: vi.fn(),
    getGenerations: vi.fn(),
  })
)

vi.mock('@/db', () => ({ default: { insert: dbInsert } }))
vi.mock('@/lib/server/services/admin/authorize', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/lib/server/services/admin/authorize')
  >()),
  loadAccessibleGenerations,
}))
vi.mock('@/lib/server/fetcher/admin/get-generations', () => ({
  getGenerations,
}))
vi.mock('@/lib/server/cache', () => ({
  invalidateGenerationPublicCache: vi.fn(),
}))

import {
  createGeneration,
  listGenerations,
} from '@/lib/server/services/admin/generations'
import type { Actor } from '@/lib/server/services/admin/types'

const all = ['gyms:read', 'gyms:write', 'gyms:admin'] as const

beforeEach(() => vi.clearAllMocks())

describe('generations service', () => {
  it('forbids CORE from creating a generation', async () => {
    const core: Actor = { userId: 'c', role: 'CORE', scopes: [...all], via: 'mcp' }
    await expect(
      createGeneration(core, { name: '13th', startDate: '2027-01-01', endDate: null })
    ).resolves.toMatchObject({ ok: false, code: 'FORBIDDEN' })
    expect(dbInsert).not.toHaveBeenCalled()
  })

  it('lists only accessible generations for a MEMBER', async () => {
    const member: Actor = { userId: 'm', role: 'MEMBER', scopes: ['gyms:read'], via: 'mcp' }
    loadAccessibleGenerations.mockResolvedValue([{ id: 12, name: '12th' }])
    getGenerations.mockResolvedValue([
      { id: 12, name: '12th', startDate: '2026-03-01', endDate: null },
      { id: 11, name: '11th', startDate: '2025-03-01', endDate: '2026-02-28' },
    ])
    await expect(listGenerations(member)).resolves.toEqual({
      ok: true,
      data: [{ id: 12, name: '12th', startDate: '2026-03-01', endDate: null }],
    })
  })
})
