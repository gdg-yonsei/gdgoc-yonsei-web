import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetSignedUrl = vi.fn()
const mockR2Send = vi.fn()

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockGetSignedUrl,
}))

vi.mock('@/lib/server/storage/r2-client', () => ({
  r2Client: {
    send: mockR2Send,
  },
}))

describe('R2 helper utilities', () => {
  const previousBucketName = process.env.R2_BUCKET_NAME

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.R2_BUCKET_NAME = 'test-bucket'
  })

  afterEach(() => {
    process.env.R2_BUCKET_NAME = previousBucketName
  })

  it('generates presigned url with expected command input', async () => {
    mockGetSignedUrl.mockResolvedValue('https://signed.example/upload')

    const { presignImageUpload } = await import('@/lib/server/storage/r2')

    const signedUrl = await presignImageUpload('images/file.png', 'image/png')

    expect(signedUrl).toBe('https://signed.example/upload')
    expect(mockGetSignedUrl).toHaveBeenCalledTimes(1)

    const [, command, options] = mockGetSignedUrl.mock.calls[0]!
    expect((command as { input: Record<string, string> }).input).toEqual({
      Bucket: 'test-bucket',
      Key: 'images/file.png',
      ContentType: 'image/png',
    })
    expect(options).toEqual({ expiresIn: 3600 })
  })

  it('throws when R2 bucket env is missing for presigned url generation', async () => {
    delete process.env.R2_BUCKET_NAME

    const { presignImageUpload } = await import('@/lib/server/storage/r2')

    await expect(
      presignImageUpload('images/file.png', 'image/png')
    ).rejects.toThrow('R2_BUCKET_NAME is not set in environment variables.')
    expect(mockGetSignedUrl).not.toHaveBeenCalled()
  })

  it('returns true immediately for empty delete list', async () => {
    const { deleteImages } = await import('@/lib/server/storage/r2')

    await expect(deleteImages([])).resolves.toBe(true)
    expect(mockR2Send).not.toHaveBeenCalled()
  })

  it('deletes provided object keys from configured bucket', async () => {
    mockR2Send.mockResolvedValue({ Deleted: [{ Key: 'images/file.png' }] })

    const { deleteImages } = await import('@/lib/server/storage/r2')

    const result = await deleteImages(['images/file.png', 'images/file-2.png'])

    expect(result).toBe(true)
    expect(mockR2Send).toHaveBeenCalledTimes(1)

    const [deleteCommand] = mockR2Send.mock.calls[0]!
    expect((deleteCommand as { input: Record<string, unknown> }).input).toEqual(
      {
        Bucket: 'test-bucket',
        Delete: {
          Objects: [{ Key: 'images/file.png' }, { Key: 'images/file-2.png' }],
        },
      }
    )
  })

  it('returns false if delete fails or bucket env is missing', async () => {
    const { deleteImages } = await import('@/lib/server/storage/r2')

    delete process.env.R2_BUCKET_NAME
    await expect(deleteImages(['images/file.png'])).resolves.toBe(false)

    process.env.R2_BUCKET_NAME = 'test-bucket'
    mockR2Send.mockRejectedValue(new Error('network issue'))
    await expect(deleteImages(['images/file.png'])).resolves.toBe(false)
  })

  it('deletes only our removed images, one request per key', async () => {
    process.env.NEXT_PUBLIC_IMAGE_URL = 'https://cdn.example/'
    mockR2Send.mockResolvedValue({})

    const { deleteRemovedImages } = await import('@/lib/server/storage/r2')

    await deleteRemovedImages({
      previousImages: [
        'https://cdn.example/projects/kept.png',
        'https://cdn.example/projects/removed.png',
        'https://elsewhere.example/projects/foreign.png',
      ],
      nextImages: ['https://cdn.example/projects/kept.png'],
      previousMainImage: 'https://cdn.example/projects/old-main.png',
      nextMainImage: 'https://cdn.example/projects/new-main.png',
      prefix: 'projects',
    })

    const keys = mockR2Send.mock.calls.map(
      ([command]) => (command as { input: { Key: string } }).input.Key
    )
    expect(keys.sort()).toEqual([
      'projects/old-main.png',
      'projects/removed.png',
    ])
  })
})
