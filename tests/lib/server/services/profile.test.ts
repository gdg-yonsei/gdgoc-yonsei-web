import { beforeEach, describe, expect, it, vi } from 'vitest'

const { dbUpdate, updateSet, findUser } = vi.hoisted(() => {
  const updateWhere = vi.fn(async () => undefined)
  const updateSet = vi.fn((values: Record<string, unknown>) => {
    void values
    return { where: updateWhere }
  })
  return {
    updateSet,
    dbUpdate: vi.fn(() => ({ set: updateSet })),
    findUser: vi.fn(),
  }
})

vi.mock('@/db', () => ({
  db: { update: dbUpdate, query: { users: { findFirst: findUser } } },
}))
vi.mock('@/lib/server/cache', () => ({
  invalidateMemberPublicCache: vi.fn(),
}))
vi.mock('@/lib/server/services/admin/cache-context', () => ({
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

const profileInput = {
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
  telephone: null,
  role: null,
  isForeigner: false,
  profileImage: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  findUser.mockResolvedValue({ email: 'me@example.com', image: null })
})

describe('profile service', () => {
  it('keeps the verified flag when the email is unchanged apart from case', async () => {
    findUser.mockResolvedValue({ email: 'Me@Example.com', image: null })
    const result = await updateMyProfile(alumnus, profileInput)
    expect(result.ok).toBe(true)
    expect(updateSet.mock.calls[0]![0]).not.toHaveProperty('email')
    expect(updateSet.mock.calls[0]![0]).not.toHaveProperty('emailVerified')
  })

  it('marks a self-entered new email as unverified so it cannot attract account linking', async () => {
    const result = await updateMyProfile(alumnus, {
      ...profileInput,
      email: 'Someone.Else@Example.com',
    })
    expect(result.ok).toBe(true)
    expect(updateSet.mock.calls[0]![0]).toMatchObject({
      email: 'someone.else@example.com',
      emailVerified: false,
    })
  })

  it('rejects a profile image that was not uploaded through GYMS', async () => {
    const result = await updateMyProfile(alumnus, {
      ...profileInput,
      profileImage: 'https://tracker.example/pixel.png',
    })
    expect(result).toMatchObject({ ok: false, code: 'VALIDATION' })
    expect(dbUpdate).not.toHaveBeenCalled()
  })

  it('keeps an existing avatar and accepts a fresh upload', async () => {
    const avatar = 'https://avatars.githubusercontent.com/u/1'
    findUser.mockResolvedValue({ email: 'me@example.com', image: avatar })
    expect(
      (
        await updateMyProfile(alumnus, {
          ...profileInput,
          profileImage: avatar,
        })
      ).ok
    ).toBe(true)
    expect(
      (
        await updateMyProfile(alumnus, {
          ...profileInput,
          profileImage: 'https://cdn.example/users/me/new.png',
        })
      ).ok
    ).toBe(true)
  })

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
