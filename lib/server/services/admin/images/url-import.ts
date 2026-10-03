/**
 * MCP URL 가져오기: 서버가 공개 URL의 이미지를 받아 R2로 스트리밍한다(셸이 없는 클라이언트용).
 * 내려받기는 `lib/server/uploads/remote-fetch.ts`가 SSRF를 막는다.
 */
import 'server-only'

import { logger } from '@/lib/server/logger'
import { publicImageUrl } from '@/lib/server/storage/object-key'
import { streamImageToR2 } from '@/lib/server/storage/r2'
import {
  fail,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'
import { detectImageType } from '@/lib/server/uploads/image-signature'
import {
  UploadError,
  fetchPublicImage,
} from '@/lib/server/uploads/remote-fetch'
import {
  assignUploadKey,
  markUploadCompleted,
} from '@/lib/server/uploads/upload-records'
import {
  MAX_IMAGE_UPLOAD_BYTES,
  TYPE_BY_MIME,
  authorizeTarget,
  newObjectKey,
  type ImageTarget,
  type UploadedImage,
} from '@/lib/server/services/admin/images/shared'
import {
  beginUpload,
  rejectUpload,
} from '@/lib/server/services/admin/images/lifecycle'

/** URL 가져오기 기록의 만료. 전체 전송 한도(10분)보다 조금 길게. */
const IMPORT_RECORD_TTL_MS = 15 * 60 * 1000

/** 서버가 공개 URL 의 이미지를 받아 R2 에 스트리밍으로 저장한다(셸이 없는 클라이언트용). */
export async function importImageFromUrl(
  actor: Actor,
  input: { target: ImageTarget; url: string }
): Promise<ServiceResult<UploadedImage>> {
  const authorization = authorizeTarget(actor, input.target)
  if (!authorization.ok) return authorization

  // 받기 전에 예약한다: 실패한 가져오기도 한도에 포함돼야 한다.
  const started = await beginUpload(actor, {
    kind: 'import',
    objectKey: null,
    ttlMs: IMPORT_RECORD_TTL_MS,
  })
  if (!started.ok) return started
  const uploadId = started.data

  let remote: Awaited<ReturnType<typeof fetchPublicImage>>
  try {
    remote = await fetchPublicImage(input.url, {
      maxBytes: MAX_IMAGE_UPLOAD_BYTES,
    })
  } catch (error) {
    await rejectUpload({ id: uploadId })
    if (error instanceof UploadError) {
      return fail(
        error.code === 'FETCH_FAILED' ? 'INTERNAL' : 'VALIDATION',
        error.message
      )
    }
    logger.error('mcp.images.import.fetch', error, { url: input.url })
    return fail('INTERNAL', 'The image could not be downloaded.')
  }

  // 여기부터 응답 본문은 이 함수의 책임이다. 스트리밍에 넘기지 못하고 끝나면 닫는다.
  let bodyHandedOff = false
  try {
    const type = TYPE_BY_MIME.get(remote.contentType)
    if (!type) {
      await rejectUpload({ id: uploadId })
      return fail(
        'VALIDATION',
        'Only jpg, png, webp, gif and avif images can be imported.'
      )
    }

    const key = newObjectKey(input.target, type)
    try {
      await assignUploadKey(uploadId, key)
    } catch (error) {
      logger.error('mcp.images.import.record', error, { uploadId })
      await rejectUpload({ id: uploadId })
      return fail('INTERNAL', 'The image could not be stored.')
    }

    let stored: Awaited<ReturnType<typeof streamImageToR2>>
    try {
      bodyHandedOff = true
      stored = await streamImageToR2(
        key,
        remote.body,
        remote.contentType,
        MAX_IMAGE_UPLOAD_BYTES
      )
    } catch (error) {
      await rejectUpload({ id: uploadId }, key)
      if (error instanceof Error && error.message === 'TOO_LARGE') {
        return fail('VALIDATION', 'The image exceeds the 200MB limit.')
      }
      logger.error('mcp.images.import.store', error, { key })
      return fail('INTERNAL', 'The image could not be stored.')
    }

    if (detectImageType(stored.head) !== type) {
      await rejectUpload({ id: uploadId }, key)
      return fail(
        'VALIDATION',
        'The downloaded file is not a valid image of its declared type.'
      )
    }

    if (!(await markUploadCompleted(key))) {
      return fail(
        'NOT_FOUND',
        'This import took too long and is being cleaned up. Try again.'
      )
    }
    return ok({
      url: publicImageUrl(key),
      objectKey: key,
      sizeBytes: stored.sizeBytes,
      contentType: remote.contentType,
    })
  } finally {
    if (!bodyHandedOff) {
      await remote.body.cancel().catch(() => undefined)
    }
  }
}
