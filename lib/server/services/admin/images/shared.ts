import 'server-only'

import { authorize, authorizeRole } from '@/lib/server/services/admin/authorize'
import type { Actor, ServiceResult } from '@/lib/server/services/admin/types'
import { isUploadedImageUrl } from '@/lib/server/storage/object-key'
import {
  IMAGE_TYPE_EXTENSIONS,
  IMAGE_TYPE_MIME,
  type DetectedImageType,
} from '@/lib/server/uploads/image-signature'

export { MAX_IMAGE_UPLOAD_BYTES } from '@/lib/upload-limits'

/** 이미지를 올릴 수 있는 대상. R2 객체 키 접두사로도 쓴다. */
export const IMAGE_TARGETS = ['sessions', 'projects', 'users'] as const
export type ImageTarget = (typeof IMAGE_TARGETS)[number]

export type UploadedImage = {
  url: string
  objectKey: string
  sizeBytes: number
  contentType: string
}

export const TYPE_BY_EXTENSION = new Map<string, DetectedImageType>(
  (
    Object.entries(IMAGE_TYPE_EXTENSIONS) as [DetectedImageType, string[]][]
  ).flatMap(([type, extensions]) =>
    extensions.map((extension) => [extension, type] as const)
  )
)
export const TYPE_BY_MIME = new Map<string, DetectedImageType>(
  (Object.entries(IMAGE_TYPE_MIME) as [DetectedImageType, string][]).map(
    ([type, mime]) => [mime, type] as const
  )
)

/**
 * 대상별 업로드 권한: 프로필은 본인 정보 수정 권한, 세션·프로젝트는 생성할 수 있는 역할.
 * 업로드는 특정 기수에 묶이지 않으므로 기수는 올린 URL을 저장하는 서비스가 확인한다.
 */
export function authorizeTarget(
  actor: Actor,
  target: ImageTarget
): ServiceResult<void> {
  return target === 'users'
    ? authorize(actor, 'put', 'members', actor.userId)
    : authorizeRole(actor, 'post', target)
}

/**
 * 그대로 저장할 수 있는 사이트 정적 이미지(public/). 이미지가 없을 때 쓰는 기본 이미지와 로고다.
 * 같은 출처의 고정 파일이라 외부 요청이나 R2 삭제로 이어지지 않는다.
 */
const SITE_STATIC_IMAGES: ReadonlySet<string> = new Set([
  '/project-default.png',
  '/session-default.png',
  '/default-image.png',
  '/default-user-profile.png',
  '/gdgoc-logo.png',
])

/**
 * 새로 저장하려는 이미지 값 가운데 받을 수 없는 것을 돌려준다.
 * 이미 그 행에 있던 값은 그대로 둘 수 있고(옛 형식 포함), 새 값은 해당 접두사로 우리 업로드가
 * 만든 공개 URL이거나 사이트 정적 이미지여야 한다. 외부 주소나 다른 종류의 객체를 저장하지 못하게 한다.
 */
export function findUnacceptableImages(
  nextImages: ReadonlyArray<string | null | undefined>,
  previousImages: ReadonlyArray<string | null | undefined>,
  target: ImageTarget
): string[] {
  const kept = new Set(previousImages.filter(Boolean))
  return nextImages.filter(
    (image): image is string =>
      Boolean(image) &&
      !kept.has(image) &&
      !SITE_STATIC_IMAGES.has(image!) &&
      !isUploadedImageUrl(image!, target)
  )
}

export const UNACCEPTABLE_IMAGE =
  'Images must be uploaded through GYMS. Upload the file again and retry.'

export function newObjectKey(target: ImageTarget, type: DetectedImageType) {
  return `${target}/${crypto.randomUUID()}.${IMAGE_TYPE_EXTENSIONS[type][0]}`
}
