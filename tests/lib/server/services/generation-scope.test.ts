import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockLoadAccessibleGenerations } = vi.hoisted(() => ({
  mockLoadAccessibleGenerations: vi.fn(),
}))
vi.mock('@/lib/server/services/admin/authorize', () => ({
  loadAccessibleGenerations: mockLoadAccessibleGenerations,
}))

import {
  resolveGenerationScope,
  resolveRequestedGenerationScope,
} from '@/lib/server/services/admin/generation-scope'

const options = [
  { id: 12, name: '12th' },
  { id: 11, name: '11th' },
]

describe('resolveGenerationScope', () => {
  beforeEach(() => {
    mockLoadAccessibleGenerations.mockReset().mockResolvedValue(options)
  })

  it('lets LEAD request all generations', async () => {
    await expect(
      resolveGenerationScope({ userId: 'u', role: 'LEAD' }, 'all')
    ).resolves.toEqual({ kind: 'all' })
  })

  it('falls back to the latest generation when a non-LEAD asks for all', async () => {
    await expect(
      resolveGenerationScope({ userId: 'u', role: 'CORE' }, 'all')
    ).resolves.toEqual({ kind: 'generation', generationId: 12 })
  })

  it('honours an accessible requested generation', async () => {
    await expect(
      resolveGenerationScope({ userId: 'u', role: 'CORE' }, 11)
    ).resolves.toEqual({ kind: 'generation', generationId: 11 })
  })

  it('ignores an inaccessible requested generation', async () => {
    await expect(
      resolveGenerationScope({ userId: 'u', role: 'CORE' }, 3)
    ).resolves.toEqual({ kind: 'generation', generationId: 12 })
  })

  it('returns null when the user has no generations', async () => {
    mockLoadAccessibleGenerations.mockResolvedValue([])
    await expect(
      resolveGenerationScope({ userId: 'u', role: 'MEMBER' })
    ).resolves.toBeNull()
  })
})

describe('resolveRequestedGenerationScope', () => {
  beforeEach(() => {
    mockLoadAccessibleGenerations.mockReset().mockResolvedValue(options)
  })

  it('refuses an explicit generation the user cannot access', async () => {
    await expect(
      resolveRequestedGenerationScope({ userId: 'u', role: 'CORE' }, 3)
    ).resolves.toMatchObject({ ok: false, code: 'FORBIDDEN' })
  })

  it('refuses "all" for non-LEAD users', async () => {
    await expect(
      resolveRequestedGenerationScope({ userId: 'u', role: 'CORE' }, 'all')
    ).resolves.toMatchObject({ ok: false, code: 'FORBIDDEN' })
  })

  it('keeps the default fallback when nothing is requested', async () => {
    await expect(
      resolveRequestedGenerationScope({ userId: 'u', role: 'CORE' })
    ).resolves.toEqual({
      ok: true,
      data: { kind: 'generation', generationId: 12 },
    })
  })

  it('accepts an accessible explicit generation', async () => {
    await expect(
      resolveRequestedGenerationScope({ userId: 'u', role: 'CORE' }, 11)
    ).resolves.toEqual({
      ok: true,
      data: { kind: 'generation', generationId: 11 },
    })
    expect(mockLoadAccessibleGenerations).toHaveBeenCalledTimes(1)
  })
})
