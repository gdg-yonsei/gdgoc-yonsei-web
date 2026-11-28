import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockAuth = vi.fn()
const mockHandlePermission = vi.fn()
const mockGetPreSignedUrl = vi.fn()
const mockR2Send = vi.fn()
const mockUpdateWhere = vi.fn()
const mockUpdateSet = vi.fn()
const mockDbUpdate = vi.fn()
const mockInvalidateMemberPublicCache = vi.fn()
const mockGetGenerationNamesForUserId = vi.fn()
const mockGetUserRole = vi.fn()
const mockUserFindFirst = vi.fn()
const mockReserveUploadSlots = vi.fn()

vi.mock('@/auth', () => ({
  getAuthSession: mockAuth,
}))

vi.mock('@/lib/server/permission/has-permission', () => ({
  hasPermission: mockHandlePermission,
}))

vi.mock('@/lib/server/storage/r2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/server/storage/r2')>()),
  presignSizedImageUpload: mockGetPreSignedUrl,
}))

vi.mock('@/lib/server/uploads/upload-records', () => ({
  reserveUploadSlots: mockReserveUploadSlots,
}))

vi.mock('@/lib/server/storage/r2-client', () => ({
  r2Client: {
    send: mockR2Send,
  },
}))

vi.mock('@/db', () => ({
  db: {
    update: mockDbUpdate,
    query: { users: { findFirst: mockUserFindFirst } },
  },
}))

vi.mock('@/lib/server/fetcher/admin/get-user-role', () => ({
  getUserRole: mockGetUserRole,
}))

vi.mock('@/lib/server/cache', () => ({
  invalidateMemberPublicCache: mockInvalidateMemberPublicCache,
}))

vi.mock('@/lib/server/services/admin/cache-context', () => ({
  getGenerationNamesForUserId: mockGetGenerationNamesForUserId,
}))

describe('admin api route validations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_IMAGE_URL = 'https://cdn.example/'
    process.env.R2_BUCKET_NAME = 'bucket'

    mockAuth.mockResolvedValue({ user: { id: 'lead-user-id' } })
    mockHandlePermission.mockResolvedValue(true)
    mockGetUserRole.mockResolvedValue('LEAD')
    mockUserFindFirst.mockResolvedValue({
      id: 'user-1',
      role: 'MEMBER',
      email: 'user-1@example.com',
    })
    mockGetPreSignedUrl.mockResolvedValue('https://upload.example')
    mockReserveUploadSlots.mockResolvedValue(true)
    mockGetGenerationNamesForUserId.mockResolvedValue(['seed-gen'])

    mockUpdateWhere.mockResolvedValue(undefined)
    mockUpdateSet.mockReturnValue({ where: mockUpdateWhere })
    mockDbUpdate.mockReturnValue({ set: mockUpdateSet })
  })

  it('rejects invalid member profile upload payload', async () => {
    const { POST } = await import('@/app/api/admin/members/profile-image/route')

    const request = new Request(
      'http://localhost/api/admin/members/profile-image',
      {
        method: 'POST',
        body: JSON.stringify({
          memberId: 'user-1',
          fileName: 'avatar',
          type: 'image/png',
          size: 1024,
        }),
      }
    )

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(mockHandlePermission).not.toHaveBeenCalled()
  })

  it('returns upload url for valid member profile upload payload', async () => {
    const { POST } = await import('@/app/api/admin/members/profile-image/route')

    const request = new Request(
      'http://localhost/api/admin/members/profile-image',
      {
        method: 'POST',
        body: JSON.stringify({
          memberId: 'user-1',
          fileName: 'avatar.png',
          type: 'image/png',
          size: 1024,
        }),
      }
    )

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.uploadUrl).toBe('https://upload.example')
    expect(json.fileName).toMatch(/^users\/user-1\/.+\.png$/)
    expect(json.contentType).toBe('image/png')
  })

  it('rejects disallowed member profile image extension', async () => {
    const { POST } = await import('@/app/api/admin/members/profile-image/route')

    const request = new Request(
      'http://localhost/api/admin/members/profile-image',
      {
        method: 'POST',
        body: JSON.stringify({
          memberId: 'user-1',
          fileName: 'avatar.php',
          type: 'image/png',
          size: 1024,
        }),
      }
    )

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('rejects invalid profile image update payload', async () => {
    const { PUT } = await import('@/app/api/admin/members/[memberId]/route')

    const request = new Request('http://localhost/api/admin/members/user-1', {
      method: 'PUT',
      body: JSON.stringify({
        profileImage: '',
      }),
    })

    const response = await PUT(request, {
      params: Promise.resolve({ memberId: 'user-1' }),
    })

    expect(response.status).toBe(400)
    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('updates profile image with valid payload', async () => {
    const { PUT } = await import('@/app/api/admin/members/[memberId]/route')

    const request = new Request('http://localhost/api/admin/members/user-1', {
      method: 'PUT',
      body: JSON.stringify({
        profileImage: 'https://cdn.example/users/user-1/avatar.png',
      }),
    })

    const response = await PUT(request, {
      params: Promise.resolve({ memberId: 'user-1' }),
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockDbUpdate).toHaveBeenCalled()
    expect(mockInvalidateMemberPublicCache).toHaveBeenCalledWith({
      memberId: 'user-1',
      generationNames: ['seed-gen'],
    })
  })

  it("forbids a CORE from changing a LEAD's profile image", async () => {
    mockAuth.mockResolvedValue({ user: { id: 'core-user-id' } })
    mockGetUserRole.mockResolvedValue('CORE')
    mockUserFindFirst.mockResolvedValue({
      id: 'lead-1',
      role: 'LEAD',
      email: 'l@example.com',
    })
    const { PUT } = await import('@/app/api/admin/members/[memberId]/route')

    const response = await PUT(
      new Request('http://localhost/api/admin/members/lead-1', {
        method: 'PUT',
        body: JSON.stringify({
          profileImage: 'https://cdn.example/users/lead-1/a.png',
        }),
      }),
      { params: Promise.resolve({ memberId: 'lead-1' }) }
    )

    expect(response.status).toBe(403)
    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('refuses a presigned profile upload for a LEAD requested by a CORE', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'core-user-id' } })
    mockGetUserRole.mockResolvedValue('CORE')
    mockUserFindFirst.mockResolvedValue({
      id: 'lead-1',
      role: 'LEAD',
      email: 'l@example.com',
    })
    const { POST } = await import('@/app/api/admin/members/profile-image/route')

    const response = await POST(
      new Request('http://localhost/api/admin/members/profile-image', {
        method: 'POST',
        body: JSON.stringify({
          memberId: 'lead-1',
          fileName: 'a.png',
          type: 'image/png',
          size: 1024,
        }),
      })
    )

    expect(response.status).toBe(403)
    expect(mockGetPreSignedUrl).not.toHaveBeenCalled()
  })

  it('rejects invalid project main-image POST payload', async () => {
    const { POST } = await import('@/app/api/admin/projects/main-image/route')

    const request = new Request(
      'http://localhost/api/admin/projects/main-image',
      {
        method: 'POST',
        body: JSON.stringify({
          fileName: 'project-image',
          type: 'image/png',
          size: 1024,
        }),
      }
    )

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('accepts valid project main-image POST payload', async () => {
    const { POST } = await import('@/app/api/admin/projects/main-image/route')

    const request = new Request(
      'http://localhost/api/admin/projects/main-image',
      {
        method: 'POST',
        body: JSON.stringify({
          fileName: 'project-image.png',
          type: 'image/png',
          size: 1024,
        }),
      }
    )

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.uploadUrl).toBe('https://upload.example')
    expect(json.fileName).toMatch(/^projects\/.+\.png$/)
  })

  it('does not expose an image delete endpoint', async () => {
    const projectRoute =
      await import('@/app/api/admin/projects/main-image/route')
    const sessionRoute =
      await import('@/app/api/admin/sessions/main-image/route')

    expect(projectRoute).not.toHaveProperty('DELETE')
    expect(sessionRoute).not.toHaveProperty('DELETE')
  })

  const presignProjectImage = async (image: Record<string, unknown>) => {
    const { POST } = await import('@/app/api/admin/projects/main-image/route')
    return POST(
      new Request('http://localhost/api/admin/projects/main-image', {
        method: 'POST',
        body: JSON.stringify(image),
      })
    )
  }

  it('signs the content type and size chosen by the server', async () => {
    const response = await presignProjectImage({
      fileName: 'photo.JPEG',
      type: 'image/jpeg',
      size: 2048,
    })

    expect(response.status).toBe(200)
    expect(mockGetPreSignedUrl).toHaveBeenCalledWith(
      expect.stringMatching(/^projects\/[0-9a-f-]{36}\.jpg$/),
      'image/jpeg',
      2048
    )
    expect(mockReserveUploadSlots).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'lead-user-id', count: 1 })
    )
  })

  it.each([
    ['an SVG', { fileName: 'logo.svg', type: 'image/svg+xml', size: 10 }],
    ['an HTML file', { fileName: 'page.html', type: 'text/html', size: 10 }],
    [
      'a type that does not match the extension',
      { fileName: 'photo.png', type: 'image/svg+xml', size: 10 },
    ],
    ['a missing size', { fileName: 'photo.png', type: 'image/png' }],
    [
      'a file over the limit',
      { fileName: 'photo.png', type: 'image/png', size: 209_715_201 },
    ],
  ])('refuses to sign an upload for %s', async (_label, image) => {
    const response = await presignProjectImage(image)

    expect(response.status).toBe(400)
    expect(mockGetPreSignedUrl).not.toHaveBeenCalled()
    expect(mockReserveUploadSlots).not.toHaveBeenCalled()
  })

  it('answers 429 once the hourly upload quota is used up', async () => {
    mockReserveUploadSlots.mockResolvedValue(false)

    const response = await presignProjectImage({
      fileName: 'photo.png',
      type: 'image/png',
      size: 10,
    })

    expect(response.status).toBe(429)
    expect(mockGetPreSignedUrl).not.toHaveBeenCalled()
  })

  it('refuses session uploads for roles that cannot create sessions', async () => {
    mockGetUserRole.mockResolvedValue('MEMBER')
    const { POST } = await import('@/app/api/admin/sessions/main-image/route')

    const response = await POST(
      new Request('http://localhost/api/admin/sessions/main-image', {
        method: 'POST',
        body: JSON.stringify({
          fileName: 'photo.png',
          type: 'image/png',
          size: 10,
        }),
      })
    )

    expect(response.status).toBe(403)
    expect(mockGetPreSignedUrl).not.toHaveBeenCalled()
  })

  it('reserves one quota slot per requested content image', async () => {
    const { POST } =
      await import('@/app/api/admin/sessions/content-image/route')

    const response = await POST(
      new Request('http://localhost/api/admin/sessions/content-image', {
        method: 'POST',
        body: JSON.stringify({
          images: [
            { fileName: 'a.png', type: 'image/png', size: 10 },
            { fileName: 'b.webp', type: 'image/webp', size: 20 },
          ],
        }),
      })
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.uploadUrls).toHaveLength(2)
    expect(json.uploadUrls[1].contentType).toBe('image/webp')
    expect(mockReserveUploadSlots).toHaveBeenCalledWith(
      expect.objectContaining({ count: 2 })
    )
  })

  it('rejects a profile image that points outside our storage', async () => {
    const { PUT } = await import('@/app/api/admin/members/[memberId]/route')

    const response = await PUT(
      new Request('http://localhost/api/admin/members/user-1', {
        method: 'PUT',
        body: JSON.stringify({
          profileImage: 'https://tracker.example/users/user-1/a.png',
        }),
      }),
      { params: Promise.resolve({ memberId: 'user-1' }) }
    )

    expect(response.status).toBe(400)
    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('rejects invalid session content-image payload', async () => {
    const { POST } =
      await import('@/app/api/admin/sessions/content-image/route')

    const request = new Request(
      'http://localhost/api/admin/sessions/content-image',
      {
        method: 'POST',
        body: JSON.stringify({
          images: [
            {
              fileName: 'session-image',
              type: 'image/png',
              size: 1024,
            },
          ],
        }),
      }
    )

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('rejects session content-image payload with too many images', async () => {
    const { POST } =
      await import('@/app/api/admin/sessions/content-image/route')

    const request = new Request(
      'http://localhost/api/admin/sessions/content-image',
      {
        method: 'POST',
        body: JSON.stringify({
          images: Array.from({ length: 21 }, (_, index) => ({
            fileName: `session-${index.toString()}.png`,
            type: 'image/png',
            size: 1024,
          })),
        }),
      }
    )

    const response = await POST(request)

    expect(response.status).toBe(400)
  })
})
