import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetSignedUrl = vi.fn()
const mockR2Send = vi.fn()

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockGetSignedUrl,
}))

vi.mock('@/lib/server/r2-client', () => ({
  default: {
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

    const { default: getPreSignedUrl } = await import(
      '@/lib/server/get-pre-signed-url'
    )

    const signedUrl = await getPreSignedUrl('images/file.png', 'image/png')

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

    const { default: getPreSignedUrl } = await import(
      '@/lib/server/get-pre-signed-url'
    )

    await expect(getPreSignedUrl('images/file.png', 'image/png')).rejects.toThrow(
      'R2_BUCKET_NAME is not set in environment variables.'
    )
    expect(mockGetSignedUrl).not.toHaveBeenCalled()
  })

  it('returns true immediately for empty delete list', async () => {
    const { default: deleteR2Images } = await import(
      '@/lib/server/delete-r2-images'
    )

    await expect(deleteR2Images([])).resolves.toBe(true)
    expect(mockR2Send).not.toHaveBeenCalled()
  })

  it('deletes provided object keys from configured bucket', async () => {
    mockR2Send.mockResolvedValue({ Deleted: [{ Key: 'images/file.png' }] })

    const { default: deleteR2Images } = await import(
      '@/lib/server/delete-r2-images'
    )

    const result = await deleteR2Images([
      'images/file.png',
      'images/file-2.png',
    ])

    expect(result).toBe(true)
    expect(mockR2Send).toHaveBeenCalledTimes(1)

    const [deleteCommand] = mockR2Send.mock.calls[0]!
    expect((deleteCommand as { input: Record<string, unknown> }).input).toEqual({
      Bucket: 'test-bucket',
      Delete: {
        Objects: [{ Key: 'images/file.png' }, { Key: 'images/file-2.png' }],
      },
    })
  })

  it('returns false if delete fails or bucket env is missing', async () => {
    const { default: deleteR2Images } = await import(
      '@/lib/server/delete-r2-images'
    )

    delete process.env.R2_BUCKET_NAME
    await expect(deleteR2Images(['images/file.png'])).resolves.toBe(false)

    process.env.R2_BUCKET_NAME = 'test-bucket'
    mockR2Send.mockRejectedValue(new Error('network issue'))
    await expect(deleteR2Images(['images/file.png'])).resolves.toBe(false)
  })
})
