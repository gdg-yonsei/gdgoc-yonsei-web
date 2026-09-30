import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  findUser,
  findUsers,
  dbUpdate,
  dbDelete,
  getMembers,
  loadAccessibleGenerations,
} = vi.hoisted(() => ({
  findUser: vi.fn(),
  findUsers: vi.fn(),
  dbUpdate: vi.fn(),
  dbDelete: vi.fn(),
  getMembers: vi.fn(),
  loadAccessibleGenerations: vi.fn(),
}))

vi.mock('@/db', () => ({
  default: {
    query: { users: { findFirst: findUser, findMany: findUsers } },
    update: dbUpdate,
    delete: dbDelete,
  },
}))
vi.mock('@/lib/server/fetcher/admin/get-members', () => ({ getMembers }))
vi.mock('@/lib/server/services/admin/authorize', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/lib/server/services/admin/authorize')
  >()),
  loadAccessibleGenerations,
}))
vi.mock('@/lib/server/cache', () => ({
  invalidateMemberPublicCache: vi.fn(),
}))
vi.mock('@/lib/server/services/cache-context', () => ({
  getGenerationNamesForUserId: vi.fn(async () => []),
}))

import {
  approveMember,
  deleteMember,
  listMembers,
  listPendingMembers,
  updateMember,
  updateMemberRole,
} from '@/lib/server/services/admin/members'
import type { Actor, Role } from '@/lib/server/services/admin/types'

const actor = (role: Role, userId = 'me'): Actor => ({
  userId,
  role,
  scopes: ['gyms:read', 'gyms:write', 'gyms:admin'],
  via: 'mcp',
})

const validMember = {
  name: 'Member',
  firstName: 'Mem',
  firstNameKo: '멤',
  lastName: 'Ber',
  lastNameKo: '버',
  email: 'm@example.com',
  githubId: null,
  instagramId: null,
  linkedInId: null,
  major: null,
  studentId: null,
  telephone: null,
  role: null,
  isForeigner: false,
  profileImage: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  loadAccessibleGenerations.mockResolvedValue([{ id: 1, name: '1st' }])
})

describe('members service', () => {
  it('forbids CORE from changing roles', async () => {
    await expect(
      updateMemberRole(actor('CORE'), { userId: 'x', role: 'LEAD' })
    ).resolves.toMatchObject({ ok: false, code: 'FORBIDDEN' })
    expect(dbUpdate).not.toHaveBeenCalled()
  })

  it('refuses a LEAD changing their own role', async () => {
    await expect(
      updateMemberRole(actor('LEAD'), { userId: 'me', role: 'MEMBER' })
    ).resolves.toMatchObject({ ok: false, code: 'CONFLICT' })
    expect(dbUpdate).not.toHaveBeenCalled()
  })

  it('refuses a LEAD deleting their own account through admin tools', async () => {
    await expect(deleteMember(actor('LEAD'), 'me')).resolves.toMatchObject({
      ok: false,
      code: 'CONFLICT',
    })
    expect(dbDelete).not.toHaveBeenCalled()
  })

  it('only approves UNVERIFIED users', async () => {
    findUser.mockResolvedValue({ id: 'x', role: 'MEMBER' })
    await expect(
      approveMember(actor('LEAD'), { userId: 'x', role: 'member' })
    ).resolves.toMatchObject({ ok: false, code: 'CONFLICT' })
    expect(dbUpdate).not.toHaveBeenCalled()
  })

  it('forbids MEMBER from updating another member', async () => {
    await expect(
      updateMember(actor('MEMBER'), 'someone-else', validMember)
    ).resolves.toMatchObject({ ok: false, code: 'FORBIDDEN' })
    expect(dbUpdate).not.toHaveBeenCalled()
  })

  it('filters the member list by role and name query', async () => {
    getMembers.mockResolvedValue([
      {
        id: 'a',
        name: 'Alice',
        firstName: 'Alice',
        lastName: 'Kim',
        firstNameKo: '앨리스',
        lastNameKo: '김',
        role: 'CORE',
      },
      {
        id: 'b',
        name: 'Bob',
        firstName: 'Bob',
        lastName: 'Lee',
        firstNameKo: '밥',
        lastNameKo: '이',
        role: 'MEMBER',
      },
    ])
    const result = await listMembers(actor('CORE'), { role: 'MEMBER' })
    expect(result.ok && result.data.map((m) => m.id)).toEqual(['b'])
    const byName = await listMembers(actor('CORE'), { query: '앨리' })
    expect(byName.ok && byName.data.map((m) => m.id)).toEqual(['a'])
  })

  it('lists pending sign-ups only for users who can approve them', async () => {
    findUsers.mockResolvedValue([
      { id: 'p1', name: 'Pending', email: 'p@x.com' },
    ])
    await expect(listPendingMembers(actor('CORE'))).resolves.toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    })
    await expect(listPendingMembers(actor('LEAD'))).resolves.toEqual({
      ok: true,
      data: [{ id: 'p1', name: 'Pending', email: 'p@x.com' }],
    })
  })
})
