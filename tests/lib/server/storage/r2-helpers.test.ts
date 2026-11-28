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

    const { presignSizedImageUpload } = await import('@/lib/server/storage/r2')

    const signedUrl = await presignSizedImageUpload(
      'images/file.png',
      'image/png',
      1234
    )

    expect(signedUrl).toBe('https://signed.example/upload')
    expect(mockGetSignedUrl).toHaveBeenCalledTimes(1)

    const [, command, options] = mockGetSignedUrl.mock.calls[0]!
    expect((command as { input: Record<string, unknown> }).input).toEqual({
      Bucket: 'test-bucket',
      Key: 'images/file.png',
      ContentType: 'image/png',
      ContentLength: 1234,
    })
    // 형식과 크기가 서명에 들어가야 업로더가 다른 Content-Type·크기로 올릴 수 없다.
    expect(options).toEqual({
      expiresIn: 900,
      signableHeaders: new Set(['content-type', 'content-length']),
    })
  })

  it('offers no way to presign an upload without signing its type and size', async () => {
    const r2 = await import('@/lib/server/storage/r2')

    expect(r2).not.toHaveProperty('presignImageUpload')
  })

  it('throws when R2 bucket env is missing for presigned url generation', async () => {
    delete process.env.R2_BUCKET_NAME

    const { presignSizedImageUpload } = await import('@/lib/server/storage/r2')

    await expect(
      presignSizedImageUpload('images/file.png', 'image/png', 10)
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
      findReferencedKeys: () => Promise.resolve(new Set<string>()),
    })

    const keys = mockR2Send.mock.calls.map(
      ([command]) => (command as { input: { Key: string } }).input.Key
    )
    expect(keys.sort()).toEqual([
      'projects/old-main.png',
      'projects/removed.png',
    ])
  })

  it('keeps removed images that another row still references', async () => {
    process.env.NEXT_PUBLIC_IMAGE_URL = 'https://cdn.example/'
    mockR2Send.mockResolvedValue({})
    const findReferencedKeys = vi.fn(() =>
      Promise.resolve(new Set(['projects/victim.png']))
    )

    const { deleteRemovedImages } = await import('@/lib/server/storage/r2')

    // 남의 이미지 URL을 자기 항목에 넣었다가 빼도 그 객체는 지워지지 않아야 한다.
    await deleteRemovedImages({
      previousImages: [
        'https://cdn.example/projects/victim.png',
        'https://cdn.example/projects/victim.png?cache=1',
        'https://cdn.example/projects/mine.png',
      ],
      nextImages: [],
      previousMainImage: null,
      nextMainImage: null,
      prefix: 'projects',
      findReferencedKeys,
    })

    expect(findReferencedKeys).toHaveBeenCalledWith([
      'projects/victim.png',
      'projects/mine.png',
    ])
    const keys = mockR2Send.mock.calls.map(
      ([command]) => (command as { input: { Key: string } }).input.Key
    )
    expect(keys).toEqual(['projects/mine.png'])
  })

  it('does not look up references when nothing of ours was removed', async () => {
    process.env.NEXT_PUBLIC_IMAGE_URL = 'https://cdn.example/'
    const findReferencedKeys = vi.fn(() => Promise.resolve(new Set<string>()))

    const { deleteRemovedImages } = await import('@/lib/server/storage/r2')

    await deleteRemovedImages({
      previousImages: ['https://elsewhere.example/projects/foreign.png'],
      nextImages: [],
      prefix: 'projects',
      findReferencedKeys,
    })

    expect(findReferencedKeys).not.toHaveBeenCalled()
    expect(mockR2Send).not.toHaveBeenCalled()
  })
})
