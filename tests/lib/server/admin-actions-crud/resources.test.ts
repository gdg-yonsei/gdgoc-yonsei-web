import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockAuth = vi.fn()
const mockHandlePermission = vi.fn()
const mockGetUserRole = vi.fn()
const mockInvalidateGenerationPublicCache = vi.fn()
const mockInvalidatePartPublicCache = vi.fn()
const mockInvalidateProjectPublicCache = vi.fn()
const mockInvalidateSessionPublicCache = vi.fn()
const mockRedirect = vi.fn()
// forbidden 대역도 throw해야 가드 뒤 코드가 실행되지 않고 실제 동작과 같아진다.
const mockForbidden = vi.fn(() => {
  throw new Error('FORBIDDEN')
})

const mockDelete = vi.fn()
const mockDeleteWhere = vi.fn()
const mockDeleteR2Images = vi.fn()

const mockQuery = {
  parts: {
    findFirst: vi.fn(),
  },
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
  getAuthSession: mockAuth,
}))

vi.mock('@/lib/server/fetcher/admin/get-user-role', () => ({
  getUserRole: mockGetUserRole,
}))

vi.mock('@/lib/server/permission/has-permission', () => ({
  hasPermission: mockHandlePermission,
}))

vi.mock('@/lib/server/cache', () => ({
  invalidateGenerationPublicCache: mockInvalidateGenerationPublicCache,
  invalidatePartPublicCache: mockInvalidatePartPublicCache,
  invalidateProjectPublicCache: mockInvalidateProjectPublicCache,
  invalidateSessionPublicCache: mockInvalidateSessionPublicCache,
}))

vi.mock('@/lib/server/services/admin/cache-context', () => ({
  getProjectCacheContext: mockGetProjectCacheContext,
  getSessionCacheContext: mockGetSessionCacheContext,
  getGenerationNameForPartId: mockGetGenerationNameForPartId,
}))

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
  forbidden: mockForbidden,
}))

vi.mock('@/db', () => ({
  db: {
    delete: mockDelete,
    query: mockQuery,
  },
}))

vi.mock('@/lib/server/storage/r2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/server/storage/r2')>()),
  deleteImages: mockDeleteR2Images,
}))

describe('delete-resource server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockAuth.mockResolvedValue({ user: { id: 'lead-user-id' } })
    mockHandlePermission.mockResolvedValue(true)
    mockGetUserRole.mockResolvedValue('LEAD')

    mockDeleteWhere.mockResolvedValue(undefined)
    mockDelete.mockReturnValue({ where: mockDeleteWhere })

    mockQuery.generations.findFirst.mockResolvedValue({ name: '10th' })
    mockQuery.parts.findFirst.mockResolvedValue({ generationsId: 1 })
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
    const { deleteResourceAction } =
      await import('@/app/components/admin/data-delete-button/actions')

    const formData = new FormData()
    formData.set('dataType', 'parts')
    formData.set('dataId', 'not-a-number')

    const result = await deleteResourceAction({ error: '' }, formData)

    expect(result).toEqual({ error: 'Invalid data id format' })
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('returns forbidden when user has no delete permission', async () => {
    // CORE 는 파트를 삭제할 수 없다(LEAD 전용).
    mockGetUserRole.mockResolvedValue('CORE')

    const { deleteResourceAction } =
      await import('@/app/components/admin/data-delete-button/actions')

    const formData = new FormData()
    formData.set('dataType', 'parts')
    formData.set('dataId', '3')

    await expect(deleteResourceAction({ error: '' }, formData)).rejects.toThrow(
      'FORBIDDEN'
    )

    expect(mockForbidden).toHaveBeenCalled()
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('still deletes the project row when R2 image cleanup fails', async () => {
    mockQuery.projects.findFirst.mockResolvedValue({
      images: ['https://cdn.example/projects/image-1.png'],
      mainImage: 'https://cdn.example/projects/main.png',
    })
    mockDeleteR2Images.mockResolvedValue(false)

    const { deleteResourceAction } =
      await import('@/app/components/admin/data-delete-button/actions')

    const formData = new FormData()
    formData.set('dataType', 'projects')
    formData.set('dataId', '00000000-0000-4000-8000-000000000666')

    await deleteResourceAction({ error: '' }, formData)

    // 행을 먼저 지운다. R2 정리가 실패해도 삭제는 성공으로 처리하고 남은 키를 로그로 남긴다.
    expect(mockDelete).toHaveBeenCalled()
    expect(mockDeleteR2Images).toHaveBeenCalledWith([
      'projects/image-1.png',
      'projects/main.png',
    ])
    expect(mockRedirect).toHaveBeenCalledWith('/admin/projects')
  })

  it('deletes part resource when request form is valid', async () => {
    const { deleteResourceAction } =
      await import('@/app/components/admin/data-delete-button/actions')

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

    const { deleteResourceAction } =
      await import('@/app/components/admin/data-delete-button/actions')

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
