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
const mockResendSend = vi.fn()
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
  parts: {
    findFirst: vi.fn(),
  },
  sessions: {
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

vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: mockResendSend,
    },
  })),
}))

function createFormData(entries: Record<string, string>) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value)
  }
  return formData
}

describe('sessions CRUD server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    process.env.NEXT_PUBLIC_SITE_URL = 'https://gdgoc.test'
    process.env.NEXT_PUBLIC_IMAGE_URL = 'https://cdn.example/'
    process.env.R2_BUCKET_NAME = 'test-bucket'
    process.env.RESEND_API_KEY = 'test-key'

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

    mockQuery.parts.findFirst.mockResolvedValue({
      id: 2,
      name: 'seed-part',
      generationsId: 1,
      generation: {
        name: 'seed-gen',
      },
    })

    mockQuery.generations.findFirst.mockResolvedValue({
      id: 1,
      name: 'seed-gen',
      parts: [],
    })
    mockQuery.sessions.findFirst.mockResolvedValue(null)
  })

  describe('read', () => {
    it('returns session validation error when end time is before start time', async () => {
      const { createSessionAction } = await import(
        '@/app/(admin)/admin/sessions/create/actions'
      )

      const formData = createFormData({
        name: 'CRUD Session',
        nameKo: 'CRUD 세션',
        description: 'Session Description',
        descriptionKo: '세션 설명',
        mainImage: '',
        contentImages: JSON.stringify([]),
        startAt: '2026-03-20T12:00',
        endAt: '2026-03-20T10:00',
        location: 'Room 201',
        locationKo: '201호',
        maxCapacity: '30',
        internalOpen: 'false',
        publicOpen: 'true',
        partId: '2',
        participantId: JSON.stringify(['user-a']),
        type: 'Part Session',
        displayOnWebsite: 'true',
      })

      const result = await createSessionAction({ error: '' }, formData)

      expect(result).toEqual({ error: 'Start time must be before end time' })
      expect(mockInsert).not.toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('creates session and warms cache for public pages', async () => {
      const sessionReturning = vi
        .fn()
        .mockResolvedValue([{ id: '00000000-0000-4000-8000-000000000333' }])
      const sessionValues = vi.fn().mockReturnValue({
        returning: sessionReturning,
      })
      const participantValues = vi.fn().mockResolvedValue(undefined)

      mockInsert
        .mockReturnValueOnce({
          values: sessionValues,
        })
        .mockReturnValueOnce({
          values: participantValues,
        })

      const { createSessionAction } = await import(
        '@/app/(admin)/admin/sessions/create/actions'
      )

      const formData = createFormData({
        name: 'CRUD Session',
        nameKo: 'CRUD 세션',
        description: '<p>Session Description</p>',
        descriptionKo: '<p>세션 설명</p>',
        mainImage: '',
        contentImages: JSON.stringify([]),
        startAt: '2026-03-20T10:00',
        endAt: '2026-03-20T12:00',
        location: 'Room 201',
        locationKo: '201호',
        maxCapacity: '30',
        internalOpen: 'false',
        publicOpen: 'true',
        partId: '2',
        participantId: JSON.stringify(['user-a']),
        type: 'Part Session',
        displayOnWebsite: 'true',
      })

      await createSessionAction({ error: '' }, formData)

      expect(sessionValues).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'CRUD Session',
          nameKo: 'CRUD 세션',
          description: 'pSession Description/p',
          descriptionKo: 'p세션 설명/p',
          partId: 2,
          publicOpen: true,
        })
      )
      expect(participantValues).toHaveBeenCalledWith([
        {
          userId: 'user-a',
          sessionId: '00000000-0000-4000-8000-000000000333',
        },
      ])
      expect(mockRevalidateCache).toHaveBeenCalledWith('sessions')
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(mockResendSend).not.toHaveBeenCalled()
      expect(mockRedirect).toHaveBeenCalledWith('/admin/sessions')
    })

    it('updates session and refreshes participant mappings', async () => {
      mockSelectLimit.mockResolvedValue([
        {
          images: [
            'https://cdn.example/sessions/keep.png',
            'https://cdn.example/sessions/remove.png',
          ],
          mainImage: 'https://cdn.example/sessions/old-main.png',
        },
      ])

      const participantValues = vi.fn().mockResolvedValue(undefined)
      mockInsert.mockReturnValue({
        values: participantValues,
      })

      const { updateSessionAction } = await import(
        '@/app/(admin)/admin/sessions/[sessionId]/edit/actions'
      )

      const formData = createFormData({
        name: 'Updated Session',
        nameKo: '업데이트 세션',
        description: '<p>Updated Session Description</p>',
        descriptionKo: '<p>업데이트 세션 설명</p>',
        mainImage: 'https://cdn.example/sessions/new-main.png',
        contentImages: JSON.stringify(['https://cdn.example/sessions/keep.png']),
        generationId: '1',
        startAt: '2026-03-20T10:00',
        endAt: '2026-03-20T12:00',
        internalOpen: 'true',
        publicOpen: 'false',
        location: 'Room 301',
        locationKo: '301호',
        maxCapacity: '40',
        partId: '2',
        participantId: JSON.stringify(['user-a', 'user-b']),
        type: 'General Session',
        displayOnWebsite: 'false',
      })

      await updateSessionAction(
        '00000000-0000-4000-8000-000000000444',
        { error: '' },
        formData
      )

      expect(mockR2Send).toHaveBeenCalledTimes(2)
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Session',
          nameKo: '업데이트 세션',
          description: 'pUpdated Session Description/p',
          descriptionKo: 'p업데이트 세션 설명/p',
          partId: 2,
          type: 'General Session',
          updatedAt: expect.any(Date),
        })
      )
      expect(participantValues).toHaveBeenCalledWith([
        {
          userId: 'user-a',
          sessionId: '00000000-0000-4000-8000-000000000444',
        },
        {
          userId: 'user-b',
          sessionId: '00000000-0000-4000-8000-000000000444',
        },
      ])
      expect(mockRevalidateCache).toHaveBeenCalledWith('sessions')
      expect(mockRedirect).toHaveBeenCalledWith(
        '/admin/sessions/00000000-0000-4000-8000-000000000444'
      )
    })
  })

  describe('delete', () => {
    it('deletes session from shared delete action path', async () => {
      mockQuery.sessions.findFirst.mockResolvedValue({
        images: ['https://cdn.example/sessions/image-1.png'],
        mainImage: 'https://cdn.example/sessions/main.png',
      })
      mockDeleteR2Images.mockResolvedValue(true)

      const { default: deleteResourceAction } = await import(
        '@/app/components/admin/data-delete-button/actions'
      )

      const formData = new FormData()
      formData.set('dataType', 'sessions')
      formData.set('dataId', '00000000-0000-4000-8000-000000000555')

      await deleteResourceAction({ error: '' }, formData)

      expect(mockDeleteR2Images).toHaveBeenCalledWith([
        'sessions/image-1.png',
        'sessions/main.png',
      ])
      expect(mockDelete).toHaveBeenCalled()
      expect(mockRevalidateCache).toHaveBeenCalledWith('sessions')
      expect(mockRedirect).toHaveBeenCalledWith('/admin/sessions')
    })
  })
})
