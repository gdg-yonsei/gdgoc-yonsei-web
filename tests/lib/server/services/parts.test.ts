import { beforeEach, describe, expect, it, vi } from 'vitest'

const { findPart, canAccessGeneration, dbUpdate, dbDelete } = vi.hoisted(
  () => ({
    findPart: vi.fn(),
    canAccessGeneration: vi.fn(),
    dbUpdate: vi.fn(),
    dbDelete: vi.fn(),
  })
)

vi.mock('@/db', () => ({
  default: {
    query: { parts: { findFirst: findPart } },
    update: dbUpdate,
    delete: dbDelete,
  },
}))
vi.mock('@/lib/server/services/admin/authorize', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/lib/server/services/admin/authorize')
  >()),
  canAccessGeneration,
}))
vi.mock('@/lib/server/cache', () => ({
  invalidatePartPublicCache: vi.fn(),
}))

import { deletePart, updatePart } from '@/lib/server/services/admin/parts'
import type { Actor } from '@/lib/server/services/admin/types'

const core: Actor = {
  userId: 'c',
  role: 'CORE',
  scopes: ['gyms:read', 'gyms:write', 'gyms:admin'],
  via: 'mcp',
}
const validPart = {
  name: 'Web',
  description: null,
  generationId: 9,
  membersList: [],
  doubleBoardMembersList: [],
}

beforeEach(() => {
  vi.clearAllMocks()
  canAccessGeneration.mockResolvedValue(true)
})

describe('parts service', () => {
  it('forbids CORE from updating a part of another generation', async () => {
    findPart.mockResolvedValue({ generationsId: 9, usersToParts: [] })
    canAccessGeneration.mockResolvedValue(false)
    await expect(updatePart(core, 3, validPart)).resolves.toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    })
    expect(dbUpdate).not.toHaveBeenCalled()
  })

  it('forbids CORE from deleting parts (LEAD only)', async () => {
    await expect(deletePart(core, 3)).resolves.toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    })
    expect(dbDelete).not.toHaveBeenCalled()
  })

  it('returns NOT_FOUND for an unknown part', async () => {
    findPart.mockResolvedValue(undefined)
    await expect(updatePart(core, 3, validPart)).resolves.toMatchObject({
      ok: false,
      code: 'NOT_FOUND',
    })
  })
})
