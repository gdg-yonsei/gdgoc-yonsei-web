// 직접 업로드는 크기·형식을 서명하고 완료 시 매직 바이트로 검증한다. 파일은 서버를 거치지 않는다.
import 'server-only'

import { logger } from '@/lib/server/logger'
import {
  getSafeImageExtension,
  normalizeR2ImageObjectKey,
  publicImageUrl,
} from '@/lib/server/storage/object-key'
import {
  PRESIGNED_UPLOAD_TTL_SECONDS,
  headImage,
  presignSizedImageUpload,
  readImageHead,
} from '@/lib/server/storage/r2'
import {
  fail,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'
import {
  IMAGE_TYPE_MIME,
  detectImageType,
} from '@/lib/server/uploads/image-signature'
import {
  UPLOAD_TOKEN_TTL_SECONDS,
  issueUploadToken,
  verifyUploadToken,
} from '@/lib/server/uploads/upload-token'
import { markUploadCompleted } from '@/lib/server/uploads/upload-records'
import {
  IMAGE_TARGETS,
  MAX_IMAGE_UPLOAD_BYTES,
  TYPE_BY_EXTENSION,
  authorizeTarget,
  newObjectKey,
  type ImageTarget,
  type UploadedImage,
} from '@/lib/server/services/admin/images/shared'
import {
  beginUpload,
  rejectUpload,
} from '@/lib/server/services/admin/images/lifecycle'

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

  const uploadUrl = await presignSizedImageUpload(
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
    url: publicImageUrl(key),
    objectKey: key,
    sizeBytes,
    contentType: IMAGE_TYPE_MIME[detected],
  })
}
