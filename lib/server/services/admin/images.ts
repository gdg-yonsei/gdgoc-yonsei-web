import 'server-only'

import { getImageEnv } from '@/lib/server/env'
import { logger } from '@/lib/server/logger'
import {
  getSafeImageExtension,
  normalizeR2ImageObjectKey,
} from '@/lib/server/r2-object-key'
import { authorize } from '@/lib/server/services/admin/authorize'
import {
  fail,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'
import {
  IMAGE_TYPE_EXTENSIONS,
  IMAGE_TYPE_MIME,
  detectImageType,
  type DetectedImageType,
} from '@/lib/server/uploads/image-signature'
import {
  PRESIGNED_UPLOAD_TTL_SECONDS,
  deleteImage,
  headImage,
  presignImagePut,
  readImageHead,
  streamImageToR2,
} from '@/lib/server/uploads/r2-upload'
import {
  UploadError,
  fetchPublicImage,
} from '@/lib/server/uploads/remote-fetch'
import {
  UPLOAD_TOKEN_TTL_SECONDS,
  issueUploadToken,
  verifyUploadToken,
} from '@/lib/server/uploads/upload-token'
import {
  assignUploadKey,
  claimExpiredUploads,
  expireUploadNow,
  finishUploadCleanup,
  markUploadCompleted,
  markUploadRejected,
  pruneSettledUploads,
  reserveUpload,
} from '@/lib/server/uploads/upload-records'

/** MCP 이미지 업로드 한도: 200MB. */
export const MAX_IMAGE_UPLOAD_BYTES = 209_715_200

/** 사용자당 한 시간에 시작할 수 있는 업로드(직접 업로드 + URL 가져오기) 수. */
export const UPLOADS_PER_HOUR = 100
/** 한 번에 치우는 만료된 미완료 업로드 수. 요청 지연을 짧게 유지한다. */
const CLEANUP_BATCH = 20
/** URL 가져오기 기록의 만료. 전체 전송 한도(10분)보다 조금 길게. */
const IMPORT_RECORD_TTL_MS = 15 * 60 * 1000
/** 정리 임대 시간. 이 안에 R2 삭제가 끝나지 않으면 다음 정리가 다시 시도한다. */
const CLEANUP_LEASE_MS = 10 * 60 * 1000
/** 끝난(완료·거절) 기록을 남겨 두는 기간. 한도는 한 시간만 보면 된다. */
const SETTLED_RETENTION_MS = 2 * 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

export const IMAGE_TARGETS = ['sessions', 'projects', 'users'] as const
export type ImageTarget = (typeof IMAGE_TARGETS)[number]

type UploadedImage = {
  url: string
  objectKey: string
  sizeBytes: number
  contentType: string
}

const TYPE_BY_EXTENSION = new Map<string, DetectedImageType>(
  (
    Object.entries(IMAGE_TYPE_EXTENSIONS) as [DetectedImageType, string[]][]
  ).flatMap(([type, extensions]) =>
    extensions.map((extension) => [extension, type] as const)
  )
)
const TYPE_BY_MIME = new Map<string, DetectedImageType>(
  (Object.entries(IMAGE_TYPE_MIME) as [DetectedImageType, string][]).map(
    ([type, mime]) => [mime, type] as const
  )
)

function authorizeTarget(
  actor: Actor,
  target: ImageTarget
): ServiceResult<void> {
  return target === 'users'
    ? authorize(actor, 'put', 'members', actor.userId)
    : authorize(actor, 'post', target)
}

function publicUrl(key: string) {
  return `${getImageEnv().NEXT_PUBLIC_IMAGE_URL.trim().replace(/\/+$/, '')}/${key}`
}

function newObjectKey(target: ImageTarget, type: DetectedImageType) {
  return `${target}/${crypto.randomUUID()}.${IMAGE_TYPE_EXTENSIONS[type][0]}`
}

/**
 * 업로드를 시작한다: 시간당 한도 안에서 기록을 원자적으로 예약하고(거절·실패한
 * 시도도 한도에 포함된다), 완료되지 않은 채 만료된 업로드를 몇 개 치운다
 * (크론 없이 사용할 때마다 조금씩 정리한다).
 */
async function beginUpload(
  actor: Actor,
  upload: {
    kind: 'presigned' | 'import'
    objectKey: string | null
    ttlMs: number
  }
): Promise<ServiceResult<string>> {
  const now = new Date()
  const id = await reserveUpload({
    userId: actor.userId,
    kind: upload.kind,
    objectKey: upload.objectKey,
    expiresAt: new Date(now.getTime() + upload.ttlMs),
    limit: UPLOADS_PER_HOUR,
    windowStart: new Date(now.getTime() - HOUR_MS),
  })
  if (!id) {
    return fail(
      'RATE_LIMITED',
      `Upload limit reached (${UPLOADS_PER_HOUR} per hour). Try again later.`
    )
  }

  await cleanUpAbandonedUploads(now)
  return ok(id)
}

/**
 * 만료된 미완료 업로드를 임대해 R2 객체를 지우고, 지운 것만 끝난 것으로 표시한다(한도에는 계속 포함).
 * R2 삭제가 실패하면 기록이 남아 임대가 끝난 뒤 다시 시도된다.
 */
async function cleanUpAbandonedUploads(now: Date) {
  try {
    const claimed = await claimExpiredUploads(
      now,
      CLEANUP_BATCH,
      CLEANUP_LEASE_MS
    )
    await Promise.all(
      claimed.map(async ({ id, objectKey }) => {
        try {
          if (objectKey) await deleteImage(objectKey)
          await finishUploadCleanup(id)
        } catch (error) {
          logger.error('mcp.images.cleanup', error, { id, objectKey })
        }
      })
    )
    await pruneSettledUploads(new Date(now.getTime() - SETTLED_RETENTION_MS))
  } catch (error) {
    logger.error('mcp.images.cleanup', error)
  }
}

/**
 * 검증에 실패한 업로드: 객체를 지우고 기록은 거절로 남긴다(한도에 계속 포함).
 * 객체 삭제가 실패하면 거절로 닫지 않고 바로 만료시켜 정리 작업이 다시 지우게 한다.
 */
async function rejectUpload(
  target: { id: string } | { objectKey: string },
  objectKey?: string
) {
  try {
    if (objectKey) {
      try {
        await deleteImage(objectKey)
      } catch (error) {
        logger.error('mcp.images.discard', error, { key: objectKey })
        await expireUploadNow(target)
        return
      }
    }
    await markUploadRejected(target)
  } catch (error) {
    logger.error('mcp.images.reject', error, { ...target })
  }
}

/**
 * 직접 업로드 1단계: 크기·형식을 서명한 PUT URL 을 발급한다.
 * 클라이언트가 R2 로 바로 올리므로 파일이 서버를 거치지 않는다.
 */
export async function createImageUpload(
  actor: Actor,
  input: {
    target: ImageTarget
    fileName: string
    mimeType: string
    sizeBytes: number
  }
): Promise<ServiceResult<unknown>> {
  const authorization = authorizeTarget(actor, input.target)
  if (!authorization.ok) return authorization

  const extension = getSafeImageExtension(input.fileName)
  const type = extension ? TYPE_BY_EXTENSION.get(extension) : undefined
  if (!type) {
    return fail(
      'VALIDATION',
      'Only jpg, jpeg, png, webp, gif and avif images can be uploaded.'
    )
  }
  if (input.mimeType !== IMAGE_TYPE_MIME[type]) {
    return fail(
      'VALIDATION',
      `mimeType must be ${IMAGE_TYPE_MIME[type]} for a .${extension} file.`
    )
  }
  if (
    !Number.isInteger(input.sizeBytes) ||
    input.sizeBytes < 1 ||
    input.sizeBytes > MAX_IMAGE_UPLOAD_BYTES
  ) {
    return fail(
      'VALIDATION',
      `sizeBytes must be between 1 and ${MAX_IMAGE_UPLOAD_BYTES} (200MB).`
    )
  }

  const objectKey = newObjectKey(input.target, type)
  const started = await beginUpload(actor, {
    kind: 'presigned',
    objectKey,
    ttlMs: UPLOAD_TOKEN_TTL_SECONDS * 1000,
  })
  if (!started.ok) return started

  const uploadUrl = await presignImagePut(
    objectKey,
    input.mimeType,
    input.sizeBytes
  )

  return ok({
    uploadUrl,
    objectKey,
    uploadToken: issueUploadToken(objectKey, actor.userId),
    method: 'PUT',
    headers: {
      'Content-Type': input.mimeType,
      'Content-Length': String(input.sizeBytes),
    },
    expiresInSeconds: PRESIGNED_UPLOAD_TTL_SECONDS,
    curlExample: `curl -X PUT -H 'Content-Type: ${input.mimeType}' --data-binary @'${input.fileName.replaceAll("'", '')}' '${uploadUrl}'`,
    next: 'After the upload succeeds, call complete_image_upload with objectKey and uploadToken.',
  })
}

/** 직접 업로드 2단계: 올라온 객체가 한도 안의 진짜 이미지인지 확인하고 URL 을 돌려준다. */
export async function completeImageUpload(
  actor: Actor,
  input: { objectKey: string; uploadToken: string }
): Promise<ServiceResult<UploadedImage>> {
  const prefix = input.objectKey.split('/')[0] as ImageTarget
  // 이 흐름이 발급한 키만 확인·삭제한다. 사이트에 이미 있는 이미지 키를 넘겨
  // 검증 실패로 지우게 만들 수 없도록 발급 토큰으로 묶는다.
  if (
    !IMAGE_TARGETS.includes(prefix) ||
    !verifyUploadToken(input.uploadToken, input.objectKey, actor.userId)
  ) {
    return fail(
      'VALIDATION',
      'objectKey and uploadToken must come from your own create_image_upload call (valid for one hour).'
    )
  }

  const authorization = authorizeTarget(actor, prefix)
  if (!authorization.ok) return authorization

  const key = normalizeR2ImageObjectKey(input.objectKey, prefix)
  const extension = key?.split('.').pop()
  const expectedType = extension ? TYPE_BY_EXTENSION.get(extension) : undefined
  if (!key || !expectedType) {
    return fail('VALIDATION', 'objectKey must come from create_image_upload.')
  }

  let sizeBytes: number
  try {
    const head = await headImage(key)
    sizeBytes = head.ContentLength ?? 0
  } catch (error) {
    if ((error as { name?: string }).name === 'NotFound') {
      return fail('NOT_FOUND', 'Nothing was uploaded for this objectKey yet.')
    }
    logger.error('mcp.images.complete.head', error, { key })
    return fail('INTERNAL', 'Could not read the uploaded object.')
  }

  if (sizeBytes < 1 || sizeBytes > MAX_IMAGE_UPLOAD_BYTES) {
    await rejectUpload({ objectKey: key }, key)
    return fail(
      'VALIDATION',
      'The uploaded file is empty or larger than 200MB.'
    )
  }

  const detected = detectImageType(await readImageHead(key))
  if (detected !== expectedType) {
    await rejectUpload({ objectKey: key }, key)
    return fail(
      'VALIDATION',
      'The uploaded file is not a valid image of the declared type. It was deleted.'
    )
  }

  // 만료돼 정리 작업이 가져간 업로드는 곧 지워지므로 URL 을 주지 않는다.
  if (!(await markUploadCompleted(key))) {
    return fail(
      'NOT_FOUND',
      'This upload expired and is being cleaned up. Start a new upload.'
    )
  }
  return ok({
    url: publicUrl(key),
    objectKey: key,
    sizeBytes,
    contentType: IMAGE_TYPE_MIME[detected],
  })
}

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
      url: publicUrl(key),
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
