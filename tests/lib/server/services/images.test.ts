import { beforeEach, describe, expect, it, vi } from 'vitest'

const r2 = vi.hoisted(() => ({
  PRESIGNED_UPLOAD_TTL_SECONDS: 900,
  presignImagePut: vi.fn(),
  headImage: vi.fn(),
  readImageHead: vi.fn(),
  deleteImage: vi.fn(),
  streamImageToR2: vi.fn(),
}))
const remote = vi.hoisted(() => ({ fetchPublicImage: vi.fn() }))
const records = vi.hoisted(() => ({
  reserveUpload: vi.fn(),
  assignUploadKey: vi.fn(),
  markUploadCompleted: vi.fn(),
  markUploadRejected: vi.fn(),
  expireUploadNow: vi.fn(),
  claimExpiredUploads: vi.fn(),
  finishUploadCleanup: vi.fn(),
  pruneSettledUploads: vi.fn(),
}))
vi.mock('@/lib/server/uploads/upload-records', () => records)

vi.mock('@/lib/server/uploads/r2-upload', () => r2)
vi.mock('@/lib/server/uploads/remote-fetch', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/lib/server/uploads/remote-fetch')
  >()),
  fetchPublicImage: remote.fetchPublicImage,
}))
vi.mock('@/lib/server/env', () => ({
  getImageEnv: () => ({ NEXT_PUBLIC_IMAGE_URL: 'https://cdn.example/' }),
}))
vi.mock('@/lib/server/env-core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/server/env-core')>()),
  getAuthEnv: () => ({
    BETTER_AUTH_SECRET: 'test-secret-at-least-32-characters-long',
  }),
}))

import {
  MAX_IMAGE_UPLOAD_BYTES,
  UPLOADS_PER_HOUR,
  completeImageUpload,
  createImageUpload,
  importImageFromUrl,
} from '@/lib/server/services/admin/images'
import { UploadError } from '@/lib/server/uploads/remote-fetch'
import type { Actor } from '@/lib/server/services/admin/types'

const core: Actor = {
  userId: 'core',
  role: 'CORE',
  scopes: ['gyms:read', 'gyms:write'],
  via: 'mcp',
}
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

beforeEach(() => {
  vi.clearAllMocks()
  records.reserveUpload.mockResolvedValue('upload-1')
  records.assignUploadKey.mockResolvedValue(undefined)
  records.markUploadCompleted.mockResolvedValue(true)
  r2.deleteImage.mockResolvedValue(undefined)
  records.claimExpiredUploads.mockResolvedValue([])
  r2.presignImagePut.mockResolvedValue(
    'https://r2.example/put?X-Amz-Signature=x'
  )
})

describe('createImageUpload', () => {
  it('issues a presigned PUT for a 200MB image', async () => {
    const result = await createImageUpload(core, {
      target: 'sessions',
      fileName: 'poster.png',
      mimeType: 'image/png',
      sizeBytes: MAX_IMAGE_UPLOAD_BYTES,
    })
    expect(result.ok).toBe(true)
    const data = result.ok
      ? (result.data as { objectKey: string; headers: Record<string, string> })
      : null
    expect(data?.objectKey).toMatch(/^sessions\/[0-9a-f-]{36}\.png$/)
    expect(data?.headers).toEqual({
      'Content-Type': 'image/png',
      'Content-Length': String(MAX_IMAGE_UPLOAD_BYTES),
    })
    expect(r2.presignImagePut).toHaveBeenCalledWith(
      data?.objectKey,
      'image/png',
      MAX_IMAGE_UPLOAD_BYTES
    )
  })

  it('rejects files over 200MB', async () => {
    await expect(
      createImageUpload(core, {
        target: 'sessions',
        fileName: 'poster.png',
        mimeType: 'image/png',
        sizeBytes: MAX_IMAGE_UPLOAD_BYTES + 1,
      })
    ).resolves.toMatchObject({ ok: false, code: 'VALIDATION' })
  })

  it('rejects SVG and mismatched MIME types', async () => {
    await expect(
      createImageUpload(core, {
        target: 'projects',
        fileName: 'a.svg',
        mimeType: 'image/svg+xml',
        sizeBytes: 10,
      })
    ).resolves.toMatchObject({ ok: false, code: 'VALIDATION' })
    await expect(
      createImageUpload(core, {
        target: 'projects',
        fileName: 'a.png',
        mimeType: 'image/jpeg',
        sizeBytes: 10,
      })
    ).resolves.toMatchObject({ ok: false, code: 'VALIDATION' })
  })

  it('refuses a MEMBER uploading session images', async () => {
    const member: Actor = { ...core, role: 'MEMBER' }
    await expect(
      createImageUpload(member, {
        target: 'sessions',
        fileName: 'a.png',
        mimeType: 'image/png',
        sizeBytes: 10,
      })
    ).resolves.toMatchObject({ ok: false, code: 'FORBIDDEN' })
  })
})

async function issued(actor: Actor = core) {
  const created = await createImageUpload(actor, {
    target: 'sessions',
    fileName: 'poster.png',
    mimeType: 'image/png',
    sizeBytes: 100,
  })
  if (!created.ok) throw new Error('upload was not issued')
  return created.data as { objectKey: string; uploadToken: string }
}

describe('completeImageUpload', () => {
  it('returns the public URL when the object is a real image', async () => {
    const upload = await issued()
    r2.headImage.mockResolvedValue({
      ContentLength: 100,
      ContentType: 'image/png',
    })
    r2.readImageHead.mockResolvedValue(PNG)
    await expect(completeImageUpload(core, upload)).resolves.toEqual({
      ok: true,
      data: {
        url: `https://cdn.example/${upload.objectKey}`,
        objectKey: upload.objectKey,
        sizeBytes: 100,
        contentType: 'image/png',
      },
    })
  })

  it('refuses keys it did not issue and never touches them', async () => {
    const upload = await issued()
    for (const input of [
      {
        objectKey: 'sessions/existing-site-image.png',
        uploadToken: upload.uploadToken,
      },
      { objectKey: upload.objectKey, uploadToken: 'forged' },
    ]) {
      await expect(completeImageUpload(core, input)).resolves.toMatchObject({
        ok: false,
        code: 'VALIDATION',
      })
    }
    expect(r2.headImage).not.toHaveBeenCalled()
    expect(r2.deleteImage).not.toHaveBeenCalled()
  })

  it('refuses an upload issued to another user', async () => {
    const upload = await issued({ ...core, userId: 'someone-else' })
    await expect(completeImageUpload(core, upload)).resolves.toMatchObject({
      ok: false,
      code: 'VALIDATION',
    })
    expect(r2.headImage).not.toHaveBeenCalled()
  })

  it('deletes the object when its bytes are not the declared image type', async () => {
    const upload = await issued()
    r2.headImage.mockResolvedValue({
      ContentLength: 100,
      ContentType: 'image/png',
    })
    r2.readImageHead.mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46]))
    await expect(completeImageUpload(core, upload)).resolves.toMatchObject({
      ok: false,
      code: 'VALIDATION',
    })
    expect(r2.deleteImage).toHaveBeenCalledWith(upload.objectKey)
  })

  it('reports NOT_FOUND when nothing was uploaded', async () => {
    const upload = await issued()
    r2.headImage.mockRejectedValue(
      Object.assign(new Error('NotFound'), { name: 'NotFound' })
    )
    await expect(completeImageUpload(core, upload)).resolves.toMatchObject({
      ok: false,
      code: 'NOT_FOUND',
    })
  })

  it('rejects keys outside the upload prefixes', async () => {
    await expect(
      completeImageUpload(core, {
        objectKey: '../secrets/abc.png',
        uploadToken: 'x',
      })
    ).resolves.toMatchObject({ ok: false, code: 'VALIDATION' })
    expect(r2.headImage).not.toHaveBeenCalled()
  })
})

describe('importImageFromUrl', () => {
  it('streams a public image into R2', async () => {
    remote.fetchPublicImage.mockResolvedValue({
      body: new ReadableStream(),
      contentType: 'image/png',
      contentLength: 8,
    })
    r2.streamImageToR2.mockResolvedValue({ sizeBytes: 8, head: PNG })
    const result = await importImageFromUrl(core, {
      target: 'projects',
      url: 'https://example.com/a.png',
    })
    expect(result).toMatchObject({
      ok: true,
      data: { contentType: 'image/png', sizeBytes: 8 },
    })
    expect(r2.streamImageToR2).toHaveBeenCalledWith(
      expect.stringMatching(/^projects\/[0-9a-f-]{36}\.png$/),
      expect.any(ReadableStream),
      'image/png',
      MAX_IMAGE_UPLOAD_BYTES
    )
  })

  it('maps blocked URLs to a validation error', async () => {
    remote.fetchPublicImage.mockRejectedValue(
      new UploadError(
        'BLOCKED_URL',
        'The URL resolves to a non-public address.'
      )
    )
    await expect(
      importImageFromUrl(core, {
        target: 'projects',
        url: 'https://internal.test/a.png',
      })
    ).resolves.toMatchObject({ ok: false, code: 'VALIDATION' })
    expect(r2.streamImageToR2).not.toHaveBeenCalled()
  })

  it('reports an oversized stream without leaving an object behind', async () => {
    remote.fetchPublicImage.mockResolvedValue({
      body: new ReadableStream(),
      contentType: 'image/png',
      contentLength: null,
    })
    r2.streamImageToR2.mockRejectedValue(new Error('TOO_LARGE'))
    await expect(
      importImageFromUrl(core, {
        target: 'projects',
        url: 'https://example.com/huge.png',
      })
    ).resolves.toMatchObject({ ok: false, code: 'VALIDATION' })
    expect(r2.deleteImage).toHaveBeenCalled()
  })

  it('deletes an imported file whose bytes are not an image', async () => {
    remote.fetchPublicImage.mockResolvedValue({
      body: new ReadableStream(),
      contentType: 'image/png',
      contentLength: 4,
    })
    r2.streamImageToR2.mockResolvedValue({
      sizeBytes: 4,
      head: new Uint8Array([0x3c, 0x73, 0x76, 0x67]),
    })
    await expect(
      importImageFromUrl(core, {
        target: 'projects',
        url: 'https://example.com/a.png',
      })
    ).resolves.toMatchObject({ ok: false, code: 'VALIDATION' })
    expect(r2.deleteImage).toHaveBeenCalled()
  })
})

describe('upload limits and cleanup', () => {
  const request = {
    target: 'sessions' as const,
    fileName: 'poster.png',
    mimeType: 'image/png',
    sizeBytes: 100,
  }

  it('allows 100 uploads per user per hour', () => {
    expect(UPLOADS_PER_HOUR).toBe(100)
  })

  it('reserves a quota slot atomically before issuing a presigned upload', async () => {
    const created = await createImageUpload(core, request)
    const { objectKey } = created.ok
      ? (created.data as { objectKey: string })
      : { objectKey: '' }
    expect(records.reserveUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'core',
        kind: 'presigned',
        objectKey,
        limit: UPLOADS_PER_HOUR,
      })
    )
  })

  it('rate-limits presigned uploads when no slot is left', async () => {
    records.reserveUpload.mockResolvedValue(null)
    await expect(createImageUpload(core, request)).resolves.toMatchObject({
      ok: false,
      code: 'RATE_LIMITED',
    })
    expect(r2.presignImagePut).not.toHaveBeenCalled()
  })

  it('reserves before fetching, so failed imports still count', async () => {
    records.reserveUpload.mockResolvedValue(null)
    await expect(
      importImageFromUrl(core, {
        target: 'projects',
        url: 'https://example.com/a.png',
      })
    ).resolves.toMatchObject({ ok: false, code: 'RATE_LIMITED' })
    expect(remote.fetchPublicImage).not.toHaveBeenCalled()

    records.reserveUpload.mockResolvedValue('upload-2')
    remote.fetchPublicImage.mockRejectedValue(
      new UploadError(
        'BLOCKED_URL',
        'The URL resolves to a non-public address.'
      )
    )
    await importImageFromUrl(core, {
      target: 'projects',
      url: 'https://internal.test/a.png',
    })
    expect(records.reserveUpload).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind: 'import', objectKey: null })
    )
    expect(records.markUploadRejected).toHaveBeenCalledWith({ id: 'upload-2' })
  })

  it('keeps rejected uploads counted instead of forgetting them', async () => {
    r2.headImage.mockResolvedValue({ ContentLength: 100 })
    r2.readImageHead.mockResolvedValue(new Uint8Array([0x25, 0x50]))
    const bad = await issued()
    await completeImageUpload(core, bad)
    expect(r2.deleteImage).toHaveBeenCalledWith(bad.objectKey)
    expect(records.markUploadRejected).toHaveBeenCalledWith({
      objectKey: bad.objectKey,
    })
  })

  it('leaves a rejected upload to cleanup when deleting its object fails', async () => {
    r2.headImage.mockResolvedValue({ ContentLength: 100 })
    r2.readImageHead.mockResolvedValue(new Uint8Array([0x25, 0x50]))
    r2.deleteImage.mockRejectedValue(new Error('R2 timeout'))
    const bad = await issued()
    await completeImageUpload(core, bad)
    // 거절로 표시하면 정리 대상에서 빠져 객체가 영구히 남는다.
    expect(records.markUploadRejected).not.toHaveBeenCalled()
    expect(records.expireUploadNow).toHaveBeenCalledWith({
      objectKey: bad.objectKey,
    })
  })

  it('does not hand out a URL for an upload cleanup already claimed', async () => {
    r2.headImage.mockResolvedValue({ ContentLength: 100 })
    r2.readImageHead.mockResolvedValue(PNG)
    records.markUploadCompleted.mockResolvedValue(false)
    const upload = await issued()
    await expect(completeImageUpload(core, upload)).resolves.toMatchObject({
      ok: false,
      code: 'NOT_FOUND',
    })
  })

  it('removes a cleanup record only after its object is deleted', async () => {
    records.claimExpiredUploads.mockResolvedValue([
      { id: 'a', objectKey: 'sessions/old.png' },
      { id: 'b', objectKey: null },
      { id: 'c', objectKey: 'projects/old.png' },
    ])
    r2.deleteImage.mockImplementation(async (key: string) => {
      if (key === 'sessions/old.png') throw new Error('R2 timeout')
    })
    await createImageUpload(core, request)
    expect(records.finishUploadCleanup).not.toHaveBeenCalledWith('a')
    expect(records.finishUploadCleanup).toHaveBeenCalledWith('b')
    expect(records.finishUploadCleanup).toHaveBeenCalledWith('c')
  })

  it('cancels an unconsumed download when the import cannot proceed', async () => {
    const cancel = vi.fn(async () => undefined)
    remote.fetchPublicImage.mockResolvedValue({
      body: { cancel } as unknown as ReadableStream,
      contentType: 'image/png',
      contentLength: 8,
    })
    records.assignUploadKey.mockRejectedValue(new Error('db down'))
    await expect(
      importImageFromUrl(core, {
        target: 'projects',
        url: 'https://example.com/a.png',
      })
    ).resolves.toMatchObject({ ok: false, code: 'INTERNAL' })
    expect(cancel).toHaveBeenCalled()
    expect(r2.streamImageToR2).not.toHaveBeenCalled()
  })

  it('marks a finished import completed', async () => {
    remote.fetchPublicImage.mockResolvedValue({
      body: new ReadableStream(),
      contentType: 'image/png',
      contentLength: 8,
    })
    r2.streamImageToR2.mockResolvedValue({ sizeBytes: 8, head: PNG })
    await importImageFromUrl(core, {
      target: 'projects',
      url: 'https://example.com/a.png',
    })
    expect(records.assignUploadKey).toHaveBeenCalledWith(
      'upload-1',
      expect.stringMatching(/^projects\//)
    )
    expect(records.markUploadCompleted).toHaveBeenCalled()
  })
})
