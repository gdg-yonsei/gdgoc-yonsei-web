import { beforeEach, describe, expect, it, vi } from 'vitest'

const { dbUpdate, updateSet } = vi.hoisted(() => {
  const updateWhere = vi.fn(async () => undefined)
  const updateSet = vi.fn((values: Record<string, unknown>) => {
    void values
    return { where: updateWhere }
  })
  return { updateSet, dbUpdate: vi.fn(() => ({ set: updateSet })) }
})

vi.mock('@/db', () => ({ default: { update: dbUpdate } }))
vi.mock('@/lib/server/cache', () => ({
  invalidateMemberPublicCache: vi.fn(),
}))
vi.mock('@/lib/server/services/cache-context', () => ({
  getGenerationNamesForUserId: vi.fn(async () => []),
}))

import {
  setSessionNotificationEmail,
  updateMyProfile,
} from '@/lib/server/services/admin/profile'
import type { Actor } from '@/lib/server/services/admin/types'

const alumnus: Actor = {
  userId: 'me',
  role: 'ALUMNUS',
  scopes: ['gyms:read', 'gyms:write'],
  via: 'mcp',
}

beforeEach(() => vi.clearAllMocks())

describe('profile service', () => {
  it('lets an alumnus edit their own profile but never their role', async () => {
    const result = await updateMyProfile(alumnus, {
      name: 'Me',
      firstName: 'M',
      firstNameKo: '엠',
      lastName: 'E',
      lastNameKo: '이',
      email: 'me@example.com',
      githubId: null,
      instagramId: null,
      linkedInId: null,
      major: null,
      studentId: '',
      telephone: '010-1111-2222',
      role: 'LEAD',
      isForeigner: false,
      profileImage: null,
    })
    expect(result).toEqual({ ok: true, data: { id: 'me' } })
    expect(updateSet.mock.calls[0]![0]).not.toHaveProperty('role')
    expect(updateSet.mock.calls[0]![0]).toMatchObject({
      telephone: '01011112222',
    })
  })

  it('sets the session notification email flag for the caller', async () => {
    await expect(setSessionNotificationEmail(alumnus, false)).resolves.toEqual({
      ok: true,
      data: { sessionNotiEmail: false },
    })
    expect(updateSet).toHaveBeenCalledWith({ sessionNotiEmail: false })
  })

  it('rejects a read-only token', async () => {
    const reader: Actor = { ...alumnus, scopes: ['gyms:read'] }
    await expect(
      setSessionNotificationEmail(reader, true)
    ).resolves.toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    })
  })
})
