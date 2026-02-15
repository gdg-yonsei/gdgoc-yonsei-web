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

describe('generation CRUD server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SITE_URL = 'https://gdgoc.yonsei.ac.kr'

    mockAuth.mockResolvedValue({ user: { id: 'lead-user-id' } })
    mockHandlePermission.mockResolvedValue(true)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null)))

    mockDeleteWhere.mockResolvedValue(undefined)
    mockDelete.mockReturnValue({ where: mockDeleteWhere })
  })

  describe('read', () => {
    it('returns validation error for invalid generation date format', async () => {
      const { createGenerationAction } = await import(
        '@/app/(admin)/admin/generations/create/actions'
      )

      const formData = new FormData()
      formData.set('name', '11th')
      formData.set('startDate', '2025/01/01')
      formData.set('endDate', '2025-12-31')

      const result = await createGenerationAction({ error: '' }, formData)

      expect(result).toEqual({ error: 'Invalid date format. Use YYYY-MM-DD.' })
      expect(mockInsert).not.toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('creates generation with empty endDate normalized to null', async () => {
      const returningMock = vi.fn().mockResolvedValue([{ id: 1 }])
      const valuesMock = vi.fn().mockReturnValue({
        returning: returningMock,
      })

      mockInsert.mockReturnValue({
        values: valuesMock,
      })

      const { createGenerationAction } = await import(
        '@/app/(admin)/admin/generations/create/actions'
      )

      const formData = new FormData()
      formData.set('name', '11th')
      formData.set('startDate', '2025-01-01')
      formData.set('endDate', '')

      await createGenerationAction({ error: '' }, formData)

      expect(valuesMock).toHaveBeenCalledWith({
        name: '11th',
        startDate: '2025-01-01',
        endDate: null,
      })
      expect(mockRevalidateCache).toHaveBeenCalledWith(['generations', 'parts'])
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(mockRedirect).toHaveBeenCalledWith('/admin/generations')
    })

    it('updates generation with empty endDate normalized to null', async () => {
      const whereMock = vi.fn().mockResolvedValue(undefined)
      const setMock = vi.fn().mockReturnValue({
        where: whereMock,
      })

      mockUpdate.mockReturnValue({
        set: setMock,
      })

      const { updateGenerationAction } = await import(
        '@/app/(admin)/admin/generations/[generationId]/edit/actions'
      )

      const formData = new FormData()
      formData.set('name', '12th')
      formData.set('startDate', '2026-01-01')
      formData.set('endDate', '')

      await updateGenerationAction('12', { error: '' }, formData)

      expect(setMock).toHaveBeenCalledWith({
        name: '12th',
        startDate: '2026-01-01',
        endDate: null,
        updatedAt: expect.any(Date),
      })
      expect(mockRedirect).toHaveBeenCalledWith('/admin/generations/12')
    })
  })

  describe('delete', () => {
    it('deletes generation from shared delete action path', async () => {
      const { default: deleteResourceAction } = await import(
        '@/app/components/admin/data-delete-button/actions'
      )

      const formData = new FormData()
      formData.set('dataType', 'generations')
      formData.set('dataId', '12')

      await deleteResourceAction({ error: '' }, formData)

      expect(mockDelete).toHaveBeenCalled()
      expect(mockRevalidateCache).toHaveBeenCalledWith([
        'generations',
        'parts',
        'members',
      ])
      expect(mockRedirect).toHaveBeenCalledWith('/admin/generations')
    })
  })
})
