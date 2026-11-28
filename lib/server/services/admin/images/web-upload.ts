// 관리자 웹의 직접 업로드. 브라우저가 R2로 바로 PUT하므로 서버가 볼 수 있는 것은 발급 시점뿐이다.
// 그래서 확장자로 형식을 정하고, Content-Type과 크기를 서명에 넣어 R2가 선언대로만 받게 한다.
import 'server-only'

import { getSafeImageExtension } from '@/lib/server/storage/object-key'
import {
  PRESIGNED_UPLOAD_TTL_SECONDS,
  presignSizedImageUpload,
} from '@/lib/server/storage/r2'
import {
  fail,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'
import {
  IMAGE_TYPE_EXTENSIONS,
  IMAGE_TYPE_MIME,
} from '@/lib/server/uploads/image-signature'
import { reserveUploadSlots } from '@/lib/server/uploads/upload-records'
import {
  MAX_IMAGE_UPLOAD_BYTES,
  TYPE_BY_EXTENSION,
} from '@/lib/server/services/admin/images/shared'

/** 사용자당 한 시간에 받을 수 있는 웹 업로드 URL 수. 사진이 많은 세션 몇 개를 연달아 올려도 남는다. */
export const WEB_UPLOADS_PER_HOUR = 300
const HOUR_MS = 60 * 60 * 1000

export type WebImageUploadRequest = {
  fileName: string
  type: string
  size: number
}

export type WebImageUpload = {
  uploadUrl: string
  /** R2 객체 키. 공개 URL은 호출부(lib/upload-image.ts)가 만든다. */
  fileName: string
  /** 서명에 들어간 Content-Type. 브라우저는 PUT에 이 값을 그대로 보내야 한다. */
  contentType: string
}

/**
 * 업로드 URL을 발급한다. `keyPrefix`는 `projects`, `sessions`, `users/{memberId}` 가운데 하나이며
 * 호출부가 권한을 확인한 뒤 넘긴다. 하나라도 거절되면 URL을 하나도 발급하지 않는다.
 */
export async function presignWebImageUploads(
  actor: Pick<Actor, 'userId'>,
  keyPrefix: string,
  requests: readonly WebImageUploadRequest[]
): Promise<ServiceResult<WebImageUpload[]>> {
  const planned: Array<{ key: string; contentType: string; size: number }> = []
  for (const request of requests) {
    const extension = getSafeImageExtension(request.fileName)
    const type = extension ? TYPE_BY_EXTENSION.get(extension) : undefined
    if (!type) {
      return fail(
        'VALIDATION',
        'Only jpg, jpeg, png, webp, gif and avif images can be uploaded.'
      )
    }
    const contentType = IMAGE_TYPE_MIME[type]
    if (request.type !== contentType) {
      return fail(
        'VALIDATION',
        `The file type must be ${contentType} for a .${extension} file.`
      )
    }
    if (
      !Number.isInteger(request.size) ||
      request.size < 1 ||
      request.size > MAX_IMAGE_UPLOAD_BYTES
    ) {
      return fail('VALIDATION', 'Images must be between 1 byte and 200MB.')
    }
    planned.push({
      key: `${keyPrefix}/${crypto.randomUUID()}.${IMAGE_TYPE_EXTENSIONS[type][0]}`,
      contentType,
      size: request.size,
    })
  }

  const now = Date.now()
  const reserved = await reserveUploadSlots({
    userId: actor.userId,
    count: planned.length,
    expiresAt: new Date(now + PRESIGNED_UPLOAD_TTL_SECONDS * 1000),
    limit: WEB_UPLOADS_PER_HOUR,
    windowStart: new Date(now - HOUR_MS),
  })
  if (!reserved) {
    return fail(
      'RATE_LIMITED',
      `Upload limit reached (${WEB_UPLOADS_PER_HOUR} per hour). Try again later.`
    )
  }

  return ok(
    await Promise.all(
      planned.map(async ({ key, contentType, size }) => ({
        uploadUrl: await presignSizedImageUpload(key, contentType, size),
        fileName: key,
        contentType,
      }))
    )
  )
}
