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
  claimExpiredUploads,
  countRecentUploads,
  forgetUpload,
  markUploadCompleted,
  recordUpload,
} from '@/lib/server/uploads/upload-records'

/** MCP 이미지 업로드 한도: 200MB. */
export const MAX_IMAGE_UPLOAD_BYTES = 209_715_200

/** 사용자당 한 시간에 시작할 수 있는 업로드(직접 업로드 + URL 가져오기) 수. */
export const UPLOADS_PER_HOUR = 100
/** 한 번에 치우는 만료된 미완료 업로드 수. 요청 지연을 짧게 유지한다. */
const CLEANUP_BATCH = 20
/** URL 가져오기 기록의 만료. 전체 전송 한도(10분)보다 조금 길게. */
const IMPORT_RECORD_TTL_MS = 15 * 60 * 1000

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
 * 업로드를 시작하기 전: 시간당 한도를 확인하고, 완료되지 않은 채 만료된 업로드를
 * 몇 개 치운다(크론 없이 사용할 때마다 조금씩 정리한다).
 */
async function beginUpload(actor: Actor): Promise<ServiceResult<void>> {
  const now = new Date()
  const recent = await countRecentUploads(
    actor.userId,
    new Date(now.getTime() - 60 * 60 * 1000)
  )
  if (recent >= UPLOADS_PER_HOUR) {
    return fail(
      'RATE_LIMITED',
      `Upload limit reached (${UPLOADS_PER_HOUR} per hour). Try again later.`
    )
  }

  try {
    const abandoned = await claimExpiredUploads(now, CLEANUP_BATCH)
    await Promise.all(abandoned.map((key) => discard(key)))
  } catch (error) {
    logger.error('mcp.images.cleanup', error)
  }
  return ok(undefined)
}

/** 검증에 실패한 업로드: 객체와 기록을 함께 지운다. */
async function rejectUpload(key: string) {
  await discard(key)
  try {
    await forgetUpload(key)
  } catch (error) {
    logger.error('mcp.images.forget', error, { key })
  }
}

async function discard(key: string) {
  try {
    await deleteImage(key)
  } catch (error) {
    logger.error('mcp.images.discard', error, { key })
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

  const started = await beginUpload(actor)
  if (!started.ok) return started

  const objectKey = newObjectKey(input.target, type)
  await recordUpload({
    objectKey,
    userId: actor.userId,
    kind: 'presigned',
    expiresAt: new Date(Date.now() + UPLOAD_TOKEN_TTL_SECONDS * 1000),
  })
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
    await rejectUpload(key)
    return fail(
      'VALIDATION',
      'The uploaded file is empty or larger than 200MB.'
    )
  }

  const detected = detectImageType(await readImageHead(key))
  if (detected !== expectedType) {
    await rejectUpload(key)
    return fail(
      'VALIDATION',
      'The uploaded file is not a valid image of the declared type. It was deleted.'
    )
  }

  await markUploadCompleted(key)
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

  const started = await beginUpload(actor)
  if (!started.ok) return started

  let remote: Awaited<ReturnType<typeof fetchPublicImage>>
  try {
    remote = await fetchPublicImage(input.url, {
      maxBytes: MAX_IMAGE_UPLOAD_BYTES,
    })
  } catch (error) {
    if (error instanceof UploadError) {
      return fail(
        error.code === 'FETCH_FAILED' ? 'INTERNAL' : 'VALIDATION',
        error.message
      )
    }
    logger.error('mcp.images.import.fetch', error, { url: input.url })
    return fail('INTERNAL', 'The image could not be downloaded.')
  }

  const type = TYPE_BY_MIME.get(remote.contentType)
  if (!type) {
    await remote.body.cancel().catch(() => undefined)
    return fail(
      'VALIDATION',
      'Only jpg, png, webp, gif and avif images can be imported.'
    )
  }

  const key = newObjectKey(input.target, type)
  await recordUpload({
    objectKey: key,
    userId: actor.userId,
    kind: 'import',
    expiresAt: new Date(Date.now() + IMPORT_RECORD_TTL_MS),
  })
  let stored: Awaited<ReturnType<typeof streamImageToR2>>
  try {
    stored = await streamImageToR2(
      key,
      remote.body,
      remote.contentType,
      MAX_IMAGE_UPLOAD_BYTES
    )
  } catch (error) {
    await rejectUpload(key)
    if (error instanceof Error && error.message === 'TOO_LARGE') {
      return fail('VALIDATION', 'The image exceeds the 200MB limit.')
    }
    logger.error('mcp.images.import.store', error, { key })
    return fail('INTERNAL', 'The image could not be stored.')
  }

  if (detectImageType(stored.head) !== type) {
    await rejectUpload(key)
    return fail(
      'VALIDATION',
      'The downloaded file is not a valid image of its declared type.'
    )
  }

  await markUploadCompleted(key)
  return ok({
    url: publicUrl(key),
    objectKey: key,
    sizeBytes: stored.sizeBytes,
    contentType: remote.contentType,
  })
}
