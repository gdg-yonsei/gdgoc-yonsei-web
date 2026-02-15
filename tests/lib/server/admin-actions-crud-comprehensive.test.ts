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
const mockDeleteR2Images = vi.fn()
const mockR2Send = vi.fn()
const mockResendSend = vi.fn()

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
  projects: {
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

vi.mock('@/lib/server/delete-r2-images', () => ({
  default: mockDeleteR2Images,
}))

vi.mock('@/lib/server/r2-client', () => ({
  default: {
    send: mockR2Send,
  },
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

describe('admin CRUD server actions (comprehensive)', () => {
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

    mockQuery.generations.findFirst.mockResolvedValue({
      id: 1,
      name: 'seed-gen',
      parts: [],
    })
    mockQuery.parts.findFirst.mockResolvedValue({
      id: 2,
      name: 'seed-part',
      generationsId: 1,
      generation: {
        name: 'seed-gen',
      },
    })
    mockQuery.projects.findFirst.mockResolvedValue(null)
    mockQuery.sessions.findFirst.mockResolvedValue(null)
  })

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
      contentImages: JSON.stringify(['https://cdn.example/projects/content-1.png']),
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
      contentImages: JSON.stringify(['https://cdn.example/projects/content-1.png']),
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
      contentImages: JSON.stringify(['https://cdn.example/projects/content-1.png']),
      participants: JSON.stringify([]),
      generationId: '1',
    })

    const result = await createProjectAction({ error: '' }, formData)

    expect(result).toEqual({ error: 'Participants is required' })
    expect(mockInsert).not.toHaveBeenCalled()
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

  it('deletes session resource and strips image base URL before R2 delete', async () => {
    mockQuery.sessions.findFirst.mockResolvedValue({
      images: [
        'https://cdn.example/sessions/image-1.png',
        'https://cdn.example/sessions/image-2.png',
      ],
      mainImage: 'https://cdn.example/sessions/main.png',
    })
    mockDeleteR2Images.mockResolvedValue(true)

    const { default: deleteResourceAction } = await import(
      '@/app/components/admin/data-delete-button/actions'
    )

    const formData = createFormData({
      dataType: 'sessions',
      dataId: '00000000-0000-4000-8000-000000000555',
    })

    await deleteResourceAction({ error: '' }, formData)

    expect(mockDeleteR2Images).toHaveBeenCalledWith([
      'sessions/image-1.png',
      'sessions/image-2.png',
      'sessions/main.png',
    ])
    expect(mockRevalidateCache).toHaveBeenCalledWith('sessions')
    expect(mockRedirect).toHaveBeenCalledWith('/admin/sessions')
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

    const formData = createFormData({
      dataType: 'projects',
      dataId: '00000000-0000-4000-8000-000000000666',
    })

    const result = await deleteResourceAction({ error: '' }, formData)

    expect(result).toEqual({ error: 'R2 Image Delete Error' })
    expect(mockDelete).not.toHaveBeenCalled()
  })
})
