import { S3Client } from '@aws-sdk/client-s3'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/server/storage/r2-client', () => ({
  r2Client: new S3Client({
    region: 'auto',
    endpoint: 'https://account.r2.cloudflarestorage.com',
    credentials: { accessKeyId: 'key', secretAccessKey: 'secret' },
  }),
}))
vi.mock('@/lib/server/env', () => ({
  getR2BucketEnv: () => ({ R2_BUCKET_NAME: 'bucket' }),
}))
vi.mock('@aws-sdk/lib-storage', () => ({
  // 실제 멀티파트 대신 Body 스트림을 끝까지 읽는다(한도 검사가 스트림에서 일어난다).
  Upload: class {
    constructor(
      private readonly options: { params: { Body: ReadableStream<Uint8Array> } }
    ) {}
    async done() {
      const reader = this.options.params.Body.getReader()
      for (;;) {
        const { done } = await reader.read()
        if (done) return {}
      }
    }
  },
}))

import {
  presignSizedImageUpload,
  streamImageToR2,
} from '@/lib/server/storage/r2'

function streamOf(...chunks: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk)
      controller.close()
    },
  })
}

describe('presignSizedImageUpload', () => {
  it('signs content-type and content-length so R2 rejects other sizes', async () => {
    const url = new URL(
      await presignSizedImageUpload('sessions/a.png', 'image/png', 1234)
    )
    const signed = url.searchParams.get('X-Amz-SignedHeaders') ?? ''
    expect(signed.split(';')).toEqual(
      expect.arrayContaining(['content-length', 'content-type', 'host'])
    )
    expect(Number(url.searchParams.get('X-Amz-Expires'))).toBe(900)
  })
})

describe('streamImageToR2', () => {
  it('uploads and returns the size and leading bytes', async () => {
    const result = await streamImageToR2(
      'sessions/a.png',
      streamOf(
        new Uint8Array([0x89, 0x50]),
        new Uint8Array([0x4e, 0x47, 1, 2])
      ),
      'image/png',
      100
    )
    expect(result.sizeBytes).toBe(6)
    expect([...result.head.slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47])
  })

  it('aborts once the stream passes the limit', async () => {
    await expect(
      streamImageToR2(
        'sessions/a.png',
        streamOf(new Uint8Array(6), new Uint8Array(6)),
        'image/png',
        10
      )
    ).rejects.toThrow('TOO_LARGE')
  })
})
