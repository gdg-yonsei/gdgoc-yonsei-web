import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getWebActor: vi.fn(),
  canAccessGeneration: vi.fn(),
  forbidden: vi.fn(() => {
    throw new Error('FORBIDDEN')
  }),
}))

vi.mock('next/navigation', () => ({ forbidden: mocks.forbidden }))
vi.mock('@/auth', () => ({ getAuthSession: vi.fn() }))
vi.mock('@/lib/server/services/admin/web-actor', () => ({
  getWebActor: mocks.getWebActor,
}))
vi.mock('@/lib/server/services/admin/authorize', () => ({
  canAccessGeneration: mocks.canAccessGeneration,
}))

import { requireGenerationAccess } from '@/lib/server/permission/require-permission'

describe('requireGenerationAccess', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lets members of the generation through', async () => {
    mocks.getWebActor.mockResolvedValue({ userId: 'u1', role: 'CORE' })
    mocks.canAccessGeneration.mockResolvedValue(true)

    await expect(requireGenerationAccess(11)).resolves.toBeUndefined()
    expect(mocks.canAccessGeneration).toHaveBeenCalledWith(
      { userId: 'u1', role: 'CORE' },
      11
    )
  })

  it('stops with 403 for another generation or no session', async () => {
    mocks.getWebActor.mockResolvedValue({ userId: 'u1', role: 'CORE' })
    mocks.canAccessGeneration.mockResolvedValue(false)
    await expect(requireGenerationAccess(10)).rejects.toThrow('FORBIDDEN')

    mocks.getWebActor.mockResolvedValue(null)
    await expect(requireGenerationAccess(10)).rejects.toThrow('FORBIDDEN')
  })
})
