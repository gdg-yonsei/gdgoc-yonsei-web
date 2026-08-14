import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockAuth = vi.fn()
const mockHandlePermission = vi.fn()
const mockInvalidateMemberPublicCache = vi.fn()
const mockRedirect = vi.fn()
// 실제 next/navigation 의 forbidden() 은 반환하지 않고 throw 한다.
// 값을 반환하는 목을 쓰면 가드 이후 코드가 계속 실행돼 실제와 다른 흐름을 검증하게 된다.
const mockForbidden = vi.fn(() => {
  throw new Error('FORBIDDEN')
})

const mockUpdate = vi.fn()
const mockDelete = vi.fn()

const mockUpdateWhere = vi.fn()
const mockUpdateSet = vi.fn()
const mockDeleteWhere = vi.fn()
const mockGetGenerationNamesForUserId = vi.fn()

vi.mock('@/auth', () => ({
  getAuthSession: mockAuth,
}))

vi.mock('@/lib/server/permission/handle-permission', () => ({
  default: mockHandlePermission,
}))

vi.mock('@/lib/server/cache', () => ({
  invalidateMemberPublicCache: mockInvalidateMemberPublicCache,
}))

vi.mock('@/lib/server/services/cache-context', () => ({
  getGenerationNamesForUserId: mockGetGenerationNamesForUserId,
}))

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
  forbidden: mockForbidden,
}))

vi.mock('@/db', () => ({
  default: {
    update: mockUpdate,
    delete: mockDelete,
  },
}))

function createFormData(entries: Record<string, string>) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value)
  }
  return formData
}

describe('members CRUD server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockAuth.mockResolvedValue({ user: { id: 'lead-user-id' } })
    mockHandlePermission.mockResolvedValue(true)
    mockGetGenerationNamesForUserId.mockResolvedValue(['5th'])

    mockUpdateWhere.mockResolvedValue(undefined)
    mockUpdateSet.mockReturnValue({ where: mockUpdateWhere })
    mockUpdate.mockReturnValue({ set: mockUpdateSet })

    mockDeleteWhere.mockResolvedValue(undefined)
    mockDelete.mockReturnValue({ where: mockDeleteWhere })
  })

  it('returns forbidden when member edit permission is denied', async () => {
    mockHandlePermission.mockResolvedValue(false)

    const { updateMemberAction } =
      await import('@/app/(admin)/admin/members/[memberId]/edit/actions')

    const formData = createFormData({
      name: 'updated-member',
      firstName: 'Updated',
      firstNameKo: '업데이트',
      lastName: 'Member',
      lastNameKo: '멤버',
      email: 'updated-member@example.com',
      githubId: 'updated-gh',
      instagramId: 'updated-ig',
      linkedInId: 'https://linkedin.com/in/updated',
      major: 'Computer Science',
      studentId: '20260001',
      telephone: '010-1234 5678',
      role: 'CORE',
      isForeigner: 'false',
      profileImage: 'https://cdn.example/users/u1.png',
    })

    await expect(
      updateMemberAction('member-1', { error: '' }, formData)
    ).rejects.toThrow('FORBIDDEN')

    expect(mockForbidden).toHaveBeenCalled()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('updates member profile and applies role when allowed', async () => {
    mockHandlePermission.mockResolvedValueOnce(true).mockResolvedValueOnce(true)

    const { updateMemberAction } =
      await import('@/app/(admin)/admin/members/[memberId]/edit/actions')

    const formData = createFormData({
      name: 'updated-member',
      firstName: 'Updated',
      firstNameKo: '업데이트',
      lastName: 'Member',
      lastNameKo: '멤버',
      email: 'updated-member@example.com',
      githubId: 'updated-gh',
      instagramId: 'updated-ig',
      linkedInId: 'https://linkedin.com/in/updated',
      major: 'Computer Science',
      studentId: '20260001',
      telephone: '010-1234 5678',
      role: 'CORE',
      isForeigner: 'false',
      profileImage: 'https://cdn.example/users/u1.png',
    })

    await updateMemberAction('member-1', { error: '' }, formData)

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        telephone: '01012345678',
        role: 'CORE',
      })
    )
    expect(mockInvalidateMemberPublicCache).toHaveBeenCalledWith({
      memberId: 'member-1',
      generationNames: ['5th'],
    })
    expect(mockRedirect).toHaveBeenCalledWith('/admin/members/member-1')
  })

  it('updates member profile without role field when role permission is denied', async () => {
    mockHandlePermission
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)

    const { updateMemberAction } =
      await import('@/app/(admin)/admin/members/[memberId]/edit/actions')

    const formData = createFormData({
      name: 'updated-member',
      firstName: 'Updated',
      firstNameKo: '업데이트',
      lastName: 'Member',
      lastNameKo: '멤버',
      email: 'updated-member@example.com',
      githubId: 'updated-gh',
      instagramId: 'updated-ig',
      linkedInId: 'https://linkedin.com/in/updated',
      major: 'Computer Science',
      studentId: '20260001',
      telephone: '010-1234-5678',
      role: 'CORE',
      isForeigner: 'false',
      profileImage: 'https://cdn.example/users/u1.png',
    })

    await updateMemberAction('member-2', { error: '' }, formData)

    const setArg = mockUpdateSet.mock.calls[0]![0]
    expect(setArg).not.toHaveProperty('role')
  })

  it('approves pending member and maps role value', async () => {
    const { default: acceptMemberAction } =
      await import('@/app/(admin)/admin/members/accept/actions')

    const formData = createFormData({
      userId: 'pending-1',
      role: 'core',
    })

    await acceptMemberAction({ error: '' }, formData)

    expect(mockUpdateSet).toHaveBeenCalledWith({ role: 'CORE' })
    expect(mockInvalidateMemberPublicCache).toHaveBeenCalledWith({
      memberId: 'pending-1',
      generationNames: ['5th'],
    })
    expect(mockRedirect).toHaveBeenCalledWith('/admin/members/accept')
  })

  it('deletes pending user from accept page', async () => {
    const { deleteUserAction } =
      await import('@/app/(admin)/admin/members/accept/actions')

    const formData = createFormData({
      userId: 'pending-2',
    })

    await deleteUserAction({ error: '' }, formData)

    expect(mockDelete).toHaveBeenCalled()
    expect(mockInvalidateMemberPublicCache).toHaveBeenCalledWith({
      memberId: 'pending-2',
      generationNames: ['5th'],
    })
    expect(mockRedirect).toHaveBeenCalledWith('/admin/members/accept')
  })
})
