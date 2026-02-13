import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockAuth = vi.fn()
const mockHandlePermission = vi.fn()
const mockGetPreSignedUrl = vi.fn()
const mockR2Send = vi.fn()
const mockUpdateWhere = vi.fn()
const mockUpdateSet = vi.fn()
const mockDbUpdate = vi.fn()
const mockRevalidateCache = vi.fn()

vi.mock('@/auth', () => ({
  auth: mockAuth,
}))

vi.mock('@/lib/server/permission/handle-permission', () => ({
  default: mockHandlePermission,
}))

vi.mock('@/lib/server/get-pre-signed-url', () => ({
  default: mockGetPreSignedUrl,
}))

vi.mock('@/lib/server/r2-client', () => ({
  default: {
    send: mockR2Send,
  },
}))

vi.mock('@/db', () => ({
  default: {
    update: mockDbUpdate,
  },
}))

vi.mock('@/lib/server/cache', () => ({
  revalidateCache: mockRevalidateCache,
}))

describe('admin api route validations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_IMAGE_URL = 'https://cdn.example/'
    process.env.R2_BUCKET_NAME = 'bucket'

    mockAuth.mockResolvedValue({ user: { id: 'lead-user-id' } })
    mockHandlePermission.mockResolvedValue(true)
    mockGetPreSignedUrl.mockResolvedValue('https://upload.example')

    mockUpdateWhere.mockResolvedValue(undefined)
    mockUpdateSet.mockReturnValue({ where: mockUpdateWhere })
    mockDbUpdate.mockReturnValue({ set: mockUpdateSet })
  })

  it('rejects invalid member profile upload payload', async () => {
    const { POST } = await import('@/app/api/admin/members/profile-image/route')

    const request = new Request('http://localhost/api/admin/members/profile-image', {
      method: 'POST',
      body: JSON.stringify({
        memberId: 'user-1',
        fileName: 'avatar',
        type: 'image/png',
      }),
    })

    const response = await POST(request as never)

    expect(response.status).toBe(400)
    expect(mockHandlePermission).not.toHaveBeenCalled()
  })

  it('returns upload url for valid member profile upload payload', async () => {
    const { POST } = await import('@/app/api/admin/members/profile-image/route')

    const request = new Request('http://localhost/api/admin/members/profile-image', {
      method: 'POST',
      body: JSON.stringify({
        memberId: 'user-1',
        fileName: 'avatar.png',
        type: 'image/png',
      }),
    })

    const response = await POST(request as never)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.uploadUrl).toBe('https://upload.example')
    expect(json.fileName).toMatch(/^https:\/\/cdn\.example\/users\/user-1\/.+\.png$/)
  })

  it('rejects disallowed member profile image extension', async () => {
    const { POST } = await import('@/app/api/admin/members/profile-image/route')

    const request = new Request('http://localhost/api/admin/members/profile-image', {
      method: 'POST',
      body: JSON.stringify({
        memberId: 'user-1',
        fileName: 'avatar.php',
        type: 'image/png',
      }),
    })

    const response = await POST(request as never)

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
    expect(mockRevalidateCache).toHaveBeenCalledWith('members')
  })

  it('rejects invalid project main-image POST payload', async () => {
    const { POST } = await import('@/app/api/admin/projects/main-image/route')

    const request = new Request('http://localhost/api/admin/projects/main-image', {
      method: 'POST',
      body: JSON.stringify({
        fileName: 'project-image',
        type: 'image/png',
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('accepts valid project main-image POST payload', async () => {
    const { POST } = await import('@/app/api/admin/projects/main-image/route')

    const request = new Request('http://localhost/api/admin/projects/main-image', {
      method: 'POST',
      body: JSON.stringify({
        fileName: 'project-image.png',
        type: 'image/png',
      }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.uploadUrl).toBe('https://upload.example')
    expect(json.fileName).toMatch(/^projects\/.+\.png$/)
  })

  it('rejects invalid project main-image DELETE payload', async () => {
    const { DELETE } = await import('@/app/api/admin/projects/main-image/route')

    const request = new Request('http://localhost/api/admin/projects/main-image', {
      method: 'DELETE',
      body: JSON.stringify({
        imageUrl: '',
      }),
    })

    const response = await DELETE(request)

    expect(response.status).toBe(400)
    expect(mockR2Send).not.toHaveBeenCalled()
  })

  it('accepts valid project main-image DELETE payload', async () => {
    const { DELETE } = await import('@/app/api/admin/projects/main-image/route')

    const request = new Request('http://localhost/api/admin/projects/main-image', {
      method: 'DELETE',
      body: JSON.stringify({
        imageUrl: 'projects/path/image.png',
      }),
    })

    const response = await DELETE(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.message).toBe('success')
    expect(mockR2Send).toHaveBeenCalledTimes(1)
  })

  it('rejects project main-image DELETE payload with external URL', async () => {
    const { DELETE } = await import('@/app/api/admin/projects/main-image/route')

    const request = new Request('http://localhost/api/admin/projects/main-image', {
      method: 'DELETE',
      body: JSON.stringify({
        imageUrl: 'https://evil.example/projects/path/image.png',
      }),
    })

    const response = await DELETE(request)

    expect(response.status).toBe(400)
    expect(mockR2Send).not.toHaveBeenCalled()
  })

  it('rejects invalid session content-image payload', async () => {
    const { POST } = await import('@/app/api/admin/sessions/content-image/route')

    const request = new Request(
      'http://localhost/api/admin/sessions/content-image',
      {
        method: 'POST',
        body: JSON.stringify({
          images: [
            {
              fileName: 'session-image',
              type: 'image/png',
            },
          ],
        }),
      }
    )

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('rejects session content-image payload with too many images', async () => {
    const { POST } = await import('@/app/api/admin/sessions/content-image/route')

    const request = new Request(
      'http://localhost/api/admin/sessions/content-image',
      {
        method: 'POST',
        body: JSON.stringify({
          images: Array.from({ length: 21 }, (_, index) => ({
            fileName: `session-${index.toString()}.png`,
            type: 'image/png',
          })),
        }),
      }
    )

    const response = await POST(request)

    expect(response.status).toBe(400)
  })
})
