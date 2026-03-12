import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCookies = vi.fn()
const mockGetUserRole = vi.fn()
const mockSelect = vi.fn()
const mockSelectDistinct = vi.fn()

vi.mock('next/headers', () => ({
  cookies: mockCookies,
}))

vi.mock('@/lib/server/fetcher/admin/get-user-role', () => ({
  default: mockGetUserRole,
}))

vi.mock('@/db', () => ({
  default: {
    select: mockSelect,
    selectDistinct: mockSelectDistinct,
  },
}))

function createSelectOrderByChain(result: unknown) {
  const chain = {
    from: vi.fn(() => chain),
    orderBy: vi.fn(async () => result),
  }

  return chain
}

function createSelectDistinctOrderByChain(result: unknown) {
  const chain = {
    from: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: vi.fn(async () => result),
  }

  return chain
}

describe('admin generation scope', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCookies.mockResolvedValue({
      get: vi.fn(() => undefined),
    })
  })

  it('resolves all-generations scope for LEAD users when the cookie requests it', async () => {
    mockGetUserRole.mockResolvedValue('LEAD')
    mockSelect.mockReturnValue(
      createSelectOrderByChain([
        { id: 12, name: '12th' },
        { id: 11, name: '11th' },
      ])
    )
    mockCookies.mockResolvedValue({
      get: vi.fn(() => ({ value: 'all' })),
    })

    const { resolveAdminGenerationScope } = await import(
      '@/lib/server/admin-generation-scope'
    )

    await expect(resolveAdminGenerationScope('lead-user')).resolves.toEqual({
      canAccessAll: true,
      options: [
        { id: 12, name: '12th' },
        { id: 11, name: '11th' },
      ],
      scope: { kind: 'all' },
      selectedGeneration: null,
    })
  })

  it('falls back to the latest accessible generation for non-lead users when the cookie is invalid', async () => {
    mockGetUserRole.mockResolvedValue('MEMBER')
    mockSelectDistinct.mockReturnValue(
      createSelectDistinctOrderByChain([
        { id: 11, name: '11th' },
        { id: 10, name: '10th' },
      ])
    )
    mockCookies.mockResolvedValue({
      get: vi.fn(() => ({ value: '999' })),
    })

    const { resolveAdminGenerationScope } = await import(
      '@/lib/server/admin-generation-scope'
    )

    await expect(resolveAdminGenerationScope('member-user')).resolves.toEqual({
      canAccessAll: false,
      options: [
        { id: 11, name: '11th' },
        { id: 10, name: '10th' },
      ],
      scope: {
        kind: 'generation',
        generationId: 11,
      },
      selectedGeneration: { id: 11, name: '11th' },
    })
  })

  it('normalizes accessible generation values for scoped users', async () => {
    mockGetUserRole.mockResolvedValue('MEMBER')
    mockSelectDistinct.mockReturnValue(
      createSelectDistinctOrderByChain([
        { id: 11, name: '11th' },
        { id: 10, name: '10th' },
      ])
    )

    const { normalizeAdminGenerationScopeValueForUser } = await import(
      '@/lib/server/admin-generation-scope'
    )

    await expect(
      normalizeAdminGenerationScopeValueForUser('member-user', '10')
    ).resolves.toBe('10')
  })

  it('rejects inaccessible scope values and falls back to the latest accessible generation', async () => {
    mockGetUserRole.mockResolvedValue('MEMBER')
    mockSelectDistinct.mockReturnValue(
      createSelectDistinctOrderByChain([
        { id: 11, name: '11th' },
        { id: 10, name: '10th' },
      ])
    )

    const { normalizeAdminGenerationScopeValueForUser } = await import(
      '@/lib/server/admin-generation-scope'
    )

    await expect(
      normalizeAdminGenerationScopeValueForUser('member-user', 'all')
    ).resolves.toBe('11')
    await expect(
      normalizeAdminGenerationScopeValueForUser('member-user', '999')
    ).resolves.toBe('11')
  })

  it('returns null when a non-lead user has no accessible generations', async () => {
    mockGetUserRole.mockResolvedValue('MEMBER')
    mockSelectDistinct.mockReturnValue(createSelectDistinctOrderByChain([]))

    const {
      normalizeAdminGenerationScopeValueForUser,
      resolveAdminGenerationScope,
    } = await import('@/lib/server/admin-generation-scope')

    await expect(resolveAdminGenerationScope('member-user')).resolves.toEqual({
      canAccessAll: false,
      options: [],
      scope: null,
      selectedGeneration: null,
    })
    await expect(
      normalizeAdminGenerationScopeValueForUser('member-user', '10')
    ).resolves.toBeNull()
  })
})
