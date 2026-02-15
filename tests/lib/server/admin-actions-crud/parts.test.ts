import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockAuth = vi.fn()
const mockHandlePermission = vi.fn()
const mockRevalidateCache = vi.fn()
const mockRedirect = vi.fn()
const mockForbidden = vi.fn(() => 'FORBIDDEN')

const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockDeleteR2Images = vi.fn()

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

vi.mock('@/lib/server/delete-r2-images', () => ({
  default: mockDeleteR2Images,
}))

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
  forbidden: mockForbidden,
}))

vi.mock('@/db', () => ({
  default: {
    insert: mockInsert,
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

describe('parts CRUD server actions', () => {
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
    it('returns validation error when part members overlap between lists', async () => {
      const { createPartAction } = await import(
        '@/app/(admin)/admin/parts/create/actions'
      )

      const formData = createFormData({
        name: 'Cloud',
        description: 'Cloud Part',
        generationId: '1',
        membersList: JSON.stringify(['user-a']),
        doubleBoardMembersList: JSON.stringify(['user-a']),
      })

      const result = await createPartAction({ error: '' }, formData)

      expect(result).toEqual({
        error:
          'There are duplicate members between members and double board members.',
      })
      expect(mockInsert).not.toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('creates part and inserts both primary and secondary members', async () => {
      const partReturning = vi.fn().mockResolvedValue([{ id: 7 }])
      const partValues = vi.fn().mockReturnValue({
        returning: partReturning,
      })
      const userToPartValues = vi.fn().mockResolvedValue(undefined)

      mockInsert
        .mockReturnValueOnce({
          values: partValues,
        })
        .mockReturnValueOnce({
          values: userToPartValues,
        })

      const { createPartAction } = await import(
        '@/app/(admin)/admin/parts/create/actions'
      )

      const formData = createFormData({
        name: 'Cloud',
        description: 'Cloud Part',
        generationId: '1',
        membersList: JSON.stringify(['user-a']),
        doubleBoardMembersList: JSON.stringify(['user-b']),
      })

      await createPartAction({ error: '' }, formData)

      expect(partValues).toHaveBeenCalledWith({
        name: 'Cloud',
        description: 'Cloud Part',
        generationsId: 1,
      })
      expect(userToPartValues).toHaveBeenCalledWith([
        {
          userId: 'user-a',
          partId: 7,
          userType: 'Primary',
        },
        {
          userId: 'user-b',
          partId: 7,
          userType: 'Secondary',
        },
      ])
      expect(mockRevalidateCache).toHaveBeenCalledWith(['parts', 'members'])
      expect(mockRedirect).toHaveBeenCalledWith('/admin/parts')
    })

    it('updates part, resets member mappings, and inserts new mappings', async () => {
      const userToPartValues = vi.fn().mockResolvedValue(undefined)
      mockInsert.mockReturnValue({
        values: userToPartValues,
      })

      const { updatePartAction } = await import(
        '@/app/(admin)/admin/parts/[partId]/edit/actions'
      )

      const formData = createFormData({
        name: 'Cloud Updated',
        description: 'Updated Cloud Part',
        generationId: '2',
        membersList: JSON.stringify(['user-a', 'user-b']),
        doubleBoardMembersList: JSON.stringify(['user-c']),
      })

      await updatePartAction('9', { error: '' }, formData)

      expect(mockUpdateSet).toHaveBeenCalledWith({
        name: 'Cloud Updated',
        description: 'Updated Cloud Part',
        generationsId: 2,
        updatedAt: expect.any(Date),
      })
      expect(mockDelete).toHaveBeenCalled()
      expect(userToPartValues).toHaveBeenCalledWith([
        {
          userId: 'user-a',
          partId: 9,
          userType: 'Primary',
        },
        {
          userId: 'user-b',
          partId: 9,
          userType: 'Primary',
        },
        {
          userId: 'user-c',
          partId: 9,
          userType: 'Secondary',
        },
      ])
      expect(mockRevalidateCache).toHaveBeenCalledWith(['parts', 'members'])
      expect(mockRedirect).toHaveBeenCalledWith('/admin/parts/9')
    })
  })

  describe('delete', () => {
    it('deletes part from shared delete action path', async () => {
      const { default: deleteResourceAction } = await import(
        '@/app/components/admin/data-delete-button/actions'
      )

      const formData = new FormData()
      formData.set('dataType', 'parts')
      formData.set('dataId', '9')

      await deleteResourceAction({ error: '' }, formData)

      expect(mockDelete).toHaveBeenCalled()
      expect(mockRevalidateCache).toHaveBeenCalledWith(['members', 'parts'])
      expect(mockRedirect).toHaveBeenCalledWith('/admin/parts')
    })
  })
})
