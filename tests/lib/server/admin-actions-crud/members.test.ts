import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockAuth = vi.fn()
const mockHandlePermission = vi.fn()
const mockRevalidateCache = vi.fn()
const mockRedirect = vi.fn()
const mockForbidden = vi.fn(() => 'FORBIDDEN')

const mockUpdate = vi.fn()
const mockDelete = vi.fn()

const mockUpdateWhere = vi.fn()
const mockUpdateSet = vi.fn()
const mockDeleteWhere = vi.fn()

vi.mock('@/auth', () => ({
  auth: mockAuth,
}))

vi.mock('@/lib/server/permission/handle-permission', () => ({
  default: mockHandlePermission,
}))

vi.mock('@/lib/server/cache', () => ({
  revalidateCache: mockRevalidateCache,
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

    mockUpdateWhere.mockResolvedValue(undefined)
    mockUpdateSet.mockReturnValue({ where: mockUpdateWhere })
    mockUpdate.mockReturnValue({ set: mockUpdateSet })

    mockDeleteWhere.mockResolvedValue(undefined)
    mockDelete.mockReturnValue({ where: mockDeleteWhere })
  })

  describe('read', () => {
    it('returns forbidden when member edit permission is denied', async () => {
      mockHandlePermission.mockResolvedValue(false)

      const { updateMemberAction } = await import(
        '@/app/(admin)/admin/members/[memberId]/edit/actions'
      )

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

      const result = await updateMemberAction('member-1', { error: '' }, formData)

      expect(mockForbidden).toHaveBeenCalled()
      expect(result).toBe('FORBIDDEN')
      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('updates member profile and applies role when allowed', async () => {
      mockHandlePermission
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)

      const { updateMemberAction } = await import(
        '@/app/(admin)/admin/members/[memberId]/edit/actions'
      )

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
      expect(mockRevalidateCache).toHaveBeenCalledWith('members')
      expect(mockRedirect).toHaveBeenCalledWith('/admin/members/member-1')
    })

    it('updates member profile without role field when role permission is denied', async () => {
      mockHandlePermission
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)

      const { updateMemberAction } = await import(
        '@/app/(admin)/admin/members/[memberId]/edit/actions'
      )

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

      const setArg = mockUpdateSet.mock.calls[0][0]
      expect(setArg).not.toHaveProperty('role')
    })

    it('approves pending member and maps role value', async () => {
      const { default: acceptMemberAction } = await import(
        '@/app/(admin)/admin/members/accept/actions'
      )

      const formData = createFormData({
        userId: 'pending-1',
        role: 'core',
      })

      await acceptMemberAction({ error: '' }, formData)

      expect(mockUpdateSet).toHaveBeenCalledWith({ role: 'CORE' })
      expect(mockRevalidateCache).toHaveBeenCalledWith('members')
      expect(mockRedirect).toHaveBeenCalledWith('/admin/members/accept')
    })
  })

  describe('delete', () => {
    it('deletes pending user from accept page', async () => {
      const { deleteUserAction } = await import(
        '@/app/(admin)/admin/members/accept/actions'
      )

      const formData = createFormData({
        userId: 'pending-2',
      })

      await deleteUserAction({ error: '' }, formData)

      expect(mockDelete).toHaveBeenCalled()
      expect(mockRevalidateCache).toHaveBeenCalledWith('members')
      expect(mockRedirect).toHaveBeenCalledWith('/admin/members/accept')
    })
  })
})
