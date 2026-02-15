import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockAuth = vi.fn()
const mockHandlePermission = vi.fn()
const mockRevalidateCache = vi.fn()
const mockRedirect = vi.fn()
const mockForbidden = vi.fn(() => 'FORBIDDEN')

const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockSelect = vi.fn()
const mockR2Send = vi.fn()
const mockDeleteR2Images = vi.fn()

const mockUpdateWhere = vi.fn()
const mockUpdateSet = vi.fn()
const mockDeleteWhere = vi.fn()
const mockSelectLimit = vi.fn()
const mockSelectWhere = vi.fn()
const mockSelectFrom = vi.fn()

const mockQuery = {
  generations: {
    findFirst: vi.fn(),
  },
  projects: {
    findFirst: vi.fn(),
  },
}

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
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    select: mockSelect,
    query: mockQuery,
  },
}))

vi.mock('@/lib/server/r2-client', () => ({
  default: {
    send: mockR2Send,
  },
}))

vi.mock('@/lib/server/delete-r2-images', () => ({
  default: mockDeleteR2Images,
}))

function createFormData(entries: Record<string, string>) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value)
  }
  return formData
}

describe('projects CRUD server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    process.env.NEXT_PUBLIC_SITE_URL = 'https://gdgoc.test'
    process.env.NEXT_PUBLIC_IMAGE_URL = 'https://cdn.example/'
    process.env.R2_BUCKET_NAME = 'test-bucket'

    mockAuth.mockResolvedValue({ user: { id: 'lead-user-id' } })
    mockHandlePermission.mockResolvedValue(true)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null)))

    mockUpdateWhere.mockResolvedValue(undefined)
    mockUpdateSet.mockReturnValue({ where: mockUpdateWhere })
    mockUpdate.mockReturnValue({ set: mockUpdateSet })

    mockDeleteWhere.mockResolvedValue(undefined)
    mockDelete.mockReturnValue({ where: mockDeleteWhere })

    mockSelectLimit.mockResolvedValue([])
    mockSelectWhere.mockReturnValue({ limit: mockSelectLimit })
    mockSelectFrom.mockReturnValue({ where: mockSelectWhere })
    mockSelect.mockReturnValue({ from: mockSelectFrom })

    mockQuery.generations.findFirst.mockResolvedValue({
      id: 1,
      name: 'seed-gen',
      parts: [],
    })
    mockQuery.projects.findFirst.mockResolvedValue(null)
  })

  describe('read', () => {
    it('returns user error when project author is unavailable in session', async () => {
      mockAuth.mockResolvedValue({ user: {} })

      const { createProjectAction } = await import(
        '@/app/(admin)/admin/projects/create/actions'
      )

      const formData = createFormData({
        name: 'CRUD Project',
        nameKo: 'CRUD 프로젝트',
        description: 'Project Description',
        descriptionKo: '프로젝트 설명',
        content: 'English',
        contentKo: '한국어',
        mainImage: 'https://cdn.example/projects/main.png',
        contentImages: JSON.stringify([
          'https://cdn.example/projects/content-1.png',
        ]),
        participants: JSON.stringify(['user-a']),
        generationId: '1',
      })

      const result = await createProjectAction({ error: '' }, formData)

      expect(result).toEqual({ error: 'User not found' })
      expect(mockInsert).not.toHaveBeenCalled()
    })

    it('returns project validation error when participants are empty', async () => {
      const { createProjectAction } = await import(
        '@/app/(admin)/admin/projects/create/actions'
      )

      const formData = createFormData({
        name: 'CRUD Project',
        nameKo: 'CRUD 프로젝트',
        description: 'Project Description',
        descriptionKo: '프로젝트 설명',
        content: 'English',
        contentKo: '한국어',
        mainImage: 'https://cdn.example/projects/main.png',
        contentImages: JSON.stringify([
          'https://cdn.example/projects/content-1.png',
        ]),
        participants: JSON.stringify([]),
        generationId: '1',
      })

      const result = await createProjectAction({ error: '' }, formData)

      expect(result).toEqual({ error: 'Participants is required' })
      expect(mockInsert).not.toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('creates project, sanitizes content, and warms public cache', async () => {
      const projectReturning = vi
        .fn()
        .mockResolvedValue([{ id: '00000000-0000-4000-8000-000000000111' }])
      const projectValues = vi.fn().mockReturnValue({
        returning: projectReturning,
      })
      const participantsValues = vi.fn().mockResolvedValue(undefined)

      mockInsert
        .mockReturnValueOnce({
          values: projectValues,
        })
        .mockReturnValueOnce({
          values: participantsValues,
        })

      const { createProjectAction } = await import(
        '@/app/(admin)/admin/projects/create/actions'
      )

      const formData = createFormData({
        name: 'CRUD Project',
        nameKo: 'CRUD 프로젝트',
        description: 'Project Description',
        descriptionKo: '프로젝트 설명',
        content: '<b>English</b>',
        contentKo: '<i>한국어</i>',
        mainImage: 'https://cdn.example/projects/main.png',
        contentImages: JSON.stringify([
          'https://cdn.example/projects/content-1.png',
        ]),
        participants: JSON.stringify(['user-a']),
        generationId: '1',
      })

      await createProjectAction({ error: '' }, formData)

      expect(projectValues).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'CRUD Project',
          nameKo: 'CRUD 프로젝트',
          description: 'Project Description',
          descriptionKo: '프로젝트 설명',
          content: 'bEnglish/b',
          contentKo: 'i한국어/i',
        })
      )
      expect(participantsValues).toHaveBeenCalledWith([
        {
          projectId: '00000000-0000-4000-8000-000000000111',
          userId: 'user-a',
        },
      ])
      expect(mockRevalidateCache).toHaveBeenCalledWith('projects')
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(mockRedirect).toHaveBeenCalledWith('/admin/projects')
    })

    it('updates project and deletes removed images from R2', async () => {
      mockSelectLimit.mockResolvedValue([
        {
          images: [
            'https://cdn.example/projects/keep.png',
            'https://cdn.example/projects/remove.png',
          ],
          mainImage: 'https://cdn.example/projects/old-main.png',
        },
      ])

      const usersToProjectsValues = vi.fn().mockResolvedValue(undefined)
      mockInsert.mockReturnValue({
        values: usersToProjectsValues,
      })

      const { updateProjectAction } = await import(
        '@/app/(admin)/admin/projects/[projectId]/edit/actions'
      )

      const formData = createFormData({
        name: 'Updated Project',
        nameKo: '업데이트 프로젝트',
        description: 'Updated Description',
        descriptionKo: '업데이트 설명',
        content: '<p>Updated</p>',
        contentKo: '<p>업데이트</p>',
        mainImage: 'https://cdn.example/projects/new-main.png',
        contentImages: JSON.stringify(['https://cdn.example/projects/keep.png']),
        participants: JSON.stringify(['user-a', 'user-b']),
        generationId: '3',
      })

      await updateProjectAction(
        '00000000-0000-4000-8000-000000000222',
        { error: '' },
        formData
      )

      expect(mockR2Send).toHaveBeenCalledTimes(2)
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Project',
          nameKo: '업데이트 프로젝트',
          description: 'Updated Description',
          descriptionKo: '업데이트 설명',
          content: 'pUpdated/p',
          contentKo: 'p업데이트/p',
          generationId: 3,
        })
      )
      expect(usersToProjectsValues).toHaveBeenCalledWith([
        {
          projectId: '00000000-0000-4000-8000-000000000222',
          userId: 'user-a',
        },
        {
          projectId: '00000000-0000-4000-8000-000000000222',
          userId: 'user-b',
        },
      ])
      expect(mockRevalidateCache).toHaveBeenCalledWith('projects')
      expect(mockRedirect).toHaveBeenCalledWith(
        '/admin/projects/00000000-0000-4000-8000-000000000222'
      )
    })
  })

  describe('delete', () => {
    it('deletes project from shared delete action path', async () => {
      mockQuery.projects.findFirst.mockResolvedValue({
        images: ['https://cdn.example/projects/image-1.png'],
        mainImage: 'https://cdn.example/projects/main.png',
      })
      mockDeleteR2Images.mockResolvedValue(true)

      const { default: deleteResourceAction } = await import(
        '@/app/components/admin/data-delete-button/actions'
      )

      const formData = new FormData()
      formData.set('dataType', 'projects')
      formData.set('dataId', '00000000-0000-4000-8000-000000000666')

      await deleteResourceAction({ error: '' }, formData)

      expect(mockDeleteR2Images).toHaveBeenCalledWith([
        'projects/image-1.png',
        'projects/main.png',
      ])
      expect(mockDelete).toHaveBeenCalled()
      expect(mockRevalidateCache).toHaveBeenCalledWith('projects')
      expect(mockRedirect).toHaveBeenCalledWith('/admin/projects')
    })
  })
})
