import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetAuthSession, mockGetUserRole, mockForbidden } = vi.hoisted(
  () => ({
    mockGetAuthSession: vi.fn(),
    mockGetUserRole: vi.fn(),
    mockForbidden: vi.fn(() => {
      throw new Error('NEXT_FORBIDDEN')
    }),
  })
)

vi.mock('@/auth', () => ({ getAuthSession: mockGetAuthSession }))
vi.mock('@/lib/server/fetcher/admin/get-user-role', () => ({
  default: mockGetUserRole,
}))
vi.mock('next/navigation', () => ({ forbidden: mockForbidden }))

import {
  getWebActor,
  toActionError,
} from '@/lib/server/services/admin/web-actor'

describe('getWebActor', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null without a signed-in user', async () => {
    mockGetAuthSession.mockResolvedValue(null)
    await expect(getWebActor()).resolves.toBeNull()
  })

  it('builds a session-scoped actor with the stored role', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1' } })
    mockGetUserRole.mockResolvedValue('CORE')
    await expect(getWebActor()).resolves.toEqual({
      userId: 'u1',
      role: 'CORE',
      scopes: 'session',
      via: 'web',
    })
  })
})

describe('toActionError', () => {
  it('turns permission failures into forbidden()', () => {
    expect(() =>
      toActionError({ ok: false, code: 'FORBIDDEN', message: 'no' })
    ).toThrow('NEXT_FORBIDDEN')
  })

  it('keeps other failures as form errors', () => {
    expect(
      toActionError({ ok: false, code: 'NOT_FOUND', message: 'Session not found' })
    ).toEqual({ error: 'Session not found' })
  })
})
