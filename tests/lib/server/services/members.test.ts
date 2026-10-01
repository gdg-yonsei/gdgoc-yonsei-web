import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  sharesGenerationWith,
  getMember,
  findUser,
  findUsers,
  dbUpdate,
  dbDelete,
  getMembers,
  loadAccessibleGenerations,
} = vi.hoisted(() => ({
  sharesGenerationWith: vi.fn(),
  getMember: vi.fn(),
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
  sharesGenerationWith,
}))
vi.mock('@/lib/server/fetcher/admin/get-member', () => ({ getMember }))
vi.mock('@/lib/server/cache', () => ({
  invalidateMemberPublicCache: vi.fn(),
}))
vi.mock('@/lib/server/services/admin/cache-context', () => ({
  getGenerationNamesForUserId: vi.fn(async () => []),
}))

import {
  approveMember,
  deleteMember,
  getMemberDetail,
  getMemberForEdit,
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
  sharesGenerationWith.mockResolvedValue(true)
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

  it('forbids CORE from editing a LEAD profile', async () => {
    findUser.mockResolvedValue({
      id: 'lead',
      role: 'LEAD',
      email: 'lead@x.com',
    })
    await expect(
      updateMember(actor('CORE'), 'lead', {
        ...validMember,
        email: 'lead@x.com',
      })
    ).resolves.toMatchObject({ ok: false, code: 'FORBIDDEN' })
    expect(dbUpdate).not.toHaveBeenCalled()
  })

  it("forbids CORE from changing a member's email", async () => {
    findUser.mockResolvedValue({ id: 'm1', role: 'MEMBER', email: 'old@x.com' })
    await expect(
      updateMember(actor('CORE'), 'm1', {
        ...validMember,
        email: 'attacker@x.com',
      })
    ).resolves.toMatchObject({ ok: false, code: 'FORBIDDEN' })
    expect(dbUpdate).not.toHaveBeenCalled()
  })

  it('lets CORE edit a member profile when the email is unchanged', async () => {
    findUser.mockResolvedValue({
      id: 'm1',
      role: 'MEMBER',
      email: 'm@example.com',
    })
    const where = vi.fn(async () => undefined)
    const set = vi.fn(() => ({ where }))
    dbUpdate.mockReturnValue({ set })
    await expect(
      updateMember(actor('CORE'), 'm1', validMember)
    ).resolves.toEqual({
      ok: true,
      data: { id: 'm1' },
    })
  })

  it('returns NOT_FOUND for an unknown member', async () => {
    findUser.mockResolvedValue(undefined)
    await expect(
      updateMember(actor('LEAD'), 'ghost', validMember)
    ).resolves.toMatchObject({
      ok: false,
      code: 'NOT_FOUND',
    })
  })

  it('hides contact details of members outside your generations', async () => {
    getMember.mockResolvedValue({
      id: 'x',
      name: 'X',
      email: 'x@x.com',
      telephone: '010',
      studentId: 1,
    })
    sharesGenerationWith.mockResolvedValue(false)
    await expect(getMemberDetail(actor('CORE'), 'x')).resolves.toMatchObject({
      ok: true,
      data: {
        id: 'x',
        name: 'X',
        email: null,
        telephone: null,
        studentId: null,
      },
    })
  })

  it('shows contact details to members of the same generation', async () => {
    getMember.mockResolvedValue({
      id: 'x',
      name: 'X',
      email: 'x@x.com',
      telephone: '010',
      studentId: 1,
    })
    await expect(getMemberDetail(actor('CORE'), 'x')).resolves.toMatchObject({
      data: { email: 'x@x.com', telephone: '010', studentId: 1 },
    })
  })

  it('forbids CORE from editing a member outside their generations', async () => {
    findUser.mockResolvedValue({
      id: 'm1',
      role: 'MEMBER',
      email: 'm@example.com',
    })
    sharesGenerationWith.mockResolvedValue(false)
    await expect(
      updateMember(actor('CORE'), 'm1', validMember)
    ).resolves.toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    })
    expect(dbUpdate).not.toHaveBeenCalled()
  })

  it('getMemberForEdit returns the full record to someone who may edit it', async () => {
    findUser.mockResolvedValue({
      id: 'm1',
      role: 'MEMBER',
      email: 'm@example.com',
    })
    getMember.mockResolvedValue({
      id: 'm1',
      email: 'm@example.com',
      telephone: '010',
    })
    await expect(getMemberForEdit(actor('CORE'), 'm1')).resolves.toMatchObject({
      ok: true,
      data: { telephone: '010' },
    })
  })
})
