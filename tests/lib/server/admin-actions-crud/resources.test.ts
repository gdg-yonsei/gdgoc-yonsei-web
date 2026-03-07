import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockAuth = vi.fn()
const mockHandlePermission = vi.fn()
const mockInvalidateGenerationPublicCache = vi.fn()
const mockInvalidatePartPublicCache = vi.fn()
const mockInvalidateProjectPublicCache = vi.fn()
const mockInvalidateSessionPublicCache = vi.fn()
const mockRedirect = vi.fn()
const mockForbidden = vi.fn(() => 'FORBIDDEN')

const mockDelete = vi.fn()
const mockDeleteWhere = vi.fn()
const mockDeleteR2Images = vi.fn()

const mockQuery = {
  generations: {
    findFirst: vi.fn(),
  },
  sessions: {
    findFirst: vi.fn(),
  },
  projects: {
    findFirst: vi.fn(),
  },
}

const mockGetProjectCacheContext = vi.fn()
const mockGetSessionCacheContext = vi.fn()
const mockGetGenerationNameForPartId = vi.fn()

vi.mock('@/auth', () => ({
  auth: mockAuth,
}))

vi.mock('@/lib/server/permission/handle-permission', () => ({
  default: mockHandlePermission,
}))

vi.mock('@/lib/server/cache', () => ({
  invalidateGenerationPublicCache: mockInvalidateGenerationPublicCache,
  invalidatePartPublicCache: mockInvalidatePartPublicCache,
  invalidateProjectPublicCache: mockInvalidateProjectPublicCache,
  invalidateSessionPublicCache: mockInvalidateSessionPublicCache,
}))

vi.mock('@/lib/server/services/cache-context', () => ({
  getProjectCacheContext: mockGetProjectCacheContext,
  getSessionCacheContext: mockGetSessionCacheContext,
  getGenerationNameForPartId: mockGetGenerationNameForPartId,
}))

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
  forbidden: mockForbidden,
}))

vi.mock('@/db', () => ({
  default: {
    delete: mockDelete,
    query: mockQuery,
  },
}))

vi.mock('@/lib/server/delete-r2-images', () => ({
  default: mockDeleteR2Images,
}))

describe('delete-resource server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockAuth.mockResolvedValue({ user: { id: 'lead-user-id' } })
    mockHandlePermission.mockResolvedValue(true)

    mockDeleteWhere.mockResolvedValue(undefined)
    mockDelete.mockReturnValue({ where: mockDeleteWhere })

    mockQuery.generations.findFirst.mockResolvedValue({ name: '10th' })
    mockQuery.sessions.findFirst.mockResolvedValue(null)
    mockQuery.projects.findFirst.mockResolvedValue(null)
    mockGetProjectCacheContext.mockResolvedValue({
      projectId: 'project-1',
      generationName: '10th',
    })
    mockGetSessionCacheContext.mockResolvedValue({
      sessionId: 'session-1',
      generationName: '10th',
    })
    mockGetGenerationNameForPartId.mockResolvedValue('10th')
  })

  it('rejects delete request when dataId format is invalid', async () => {
    const { default: deleteResourceAction } = await import(
      '@/app/components/admin/data-delete-button/actions'
    )

    const formData = new FormData()
    formData.set('dataType', 'parts')
    formData.set('dataId', 'not-a-number')

    const result = await deleteResourceAction({ error: '' }, formData)

    expect(result).toEqual({ error: 'Invalid data id format' })
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('returns forbidden when user has no delete permission', async () => {
    mockHandlePermission.mockResolvedValue(false)

    const { default: deleteResourceAction } = await import(
      '@/app/components/admin/data-delete-button/actions'
    )

    const formData = new FormData()
    formData.set('dataType', 'parts')
    formData.set('dataId', '3')

    const result = await deleteResourceAction({ error: '' }, formData)

    expect(mockForbidden).toHaveBeenCalled()
    expect(result).toBe('FORBIDDEN')
  })

  it('returns R2 error when project image deletion fails', async () => {
    mockQuery.projects.findFirst.mockResolvedValue({
      images: ['https://cdn.example/projects/image-1.png'],
      mainImage: 'https://cdn.example/projects/main.png',
    })
    mockDeleteR2Images.mockResolvedValue(false)

    const { default: deleteResourceAction } = await import(
      '@/app/components/admin/data-delete-button/actions'
    )

    const formData = new FormData()
    formData.set('dataType', 'projects')
    formData.set('dataId', '00000000-0000-4000-8000-000000000666')

    const result = await deleteResourceAction({ error: '' }, formData)

    expect(result).toEqual({ error: 'R2 Image Delete Error' })
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('deletes part resource when request form is valid', async () => {
    const { default: deleteResourceAction } = await import(
      '@/app/components/admin/data-delete-button/actions'
    )

    const formData = new FormData()
    formData.set('dataType', 'parts')
    formData.set('dataId', '3')

    await deleteResourceAction({ error: '' }, formData)

    expect(mockDelete).toHaveBeenCalled()
    expect(mockInvalidatePartPublicCache).toHaveBeenCalledWith(['10th'])
    expect(mockRedirect).toHaveBeenCalledWith('/admin/parts')
  })

  it('deletes session resource and strips image base URL before R2 delete', async () => {
    mockQuery.sessions.findFirst.mockResolvedValue({
      images: [
        'https://cdn.example/sessions/image-1.png',
        'https://cdn.example/sessions/image-2.png',
      ],
      mainImage: 'https://cdn.example/sessions/main.png',
    })
    mockDeleteR2Images.mockResolvedValue(true)
    mockGetSessionCacheContext.mockResolvedValue({
      sessionId: '00000000-0000-4000-8000-000000000555',
      generationName: '10th',
    })

    const { default: deleteResourceAction } = await import(
      '@/app/components/admin/data-delete-button/actions'
    )

    const formData = new FormData()
    formData.set('dataType', 'sessions')
    formData.set('dataId', '00000000-0000-4000-8000-000000000555')

    await deleteResourceAction({ error: '' }, formData)

    expect(mockDeleteR2Images).toHaveBeenCalledWith([
      'sessions/image-1.png',
      'sessions/image-2.png',
      'sessions/main.png',
    ])
    expect(mockInvalidateSessionPublicCache).toHaveBeenCalledWith({
      sessionId: '00000000-0000-4000-8000-000000000555',
      previousGenerationName: '10th',
    })
    expect(mockRedirect).toHaveBeenCalledWith('/admin/sessions')
  })
})
