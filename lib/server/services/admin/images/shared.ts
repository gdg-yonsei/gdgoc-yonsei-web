/**
 * MCP 이미지 업로드 모듈들이 함께 쓰는 한도, 업로드 대상, 형식표, 권한 확인.
 */
import 'server-only'

import { authorize } from '@/lib/server/services/admin/authorize'
import type { Actor, ServiceResult } from '@/lib/server/services/admin/types'
import {
  IMAGE_TYPE_EXTENSIONS,
  IMAGE_TYPE_MIME,
  type DetectedImageType,
} from '@/lib/server/uploads/image-signature'

/** MCP 이미지 업로드 한도: 200MB. */
export const MAX_IMAGE_UPLOAD_BYTES = 209_715_200

/** 이미지를 올릴 수 있는 대상. R2 객체 키 접두사로도 쓴다. */
export const IMAGE_TARGETS = ['sessions', 'projects', 'users'] as const
/** 이미지 업로드 대상 유니온. */
export type ImageTarget = (typeof IMAGE_TARGETS)[number]

/** 업로드를 마친 이미지(공개 URL과 R2 객체 정보). */
export type UploadedImage = {
  url: string
  objectKey: string
  sizeBytes: number
  contentType: string
}

/** 확장자 → 이미지 형식. */
export const TYPE_BY_EXTENSION = new Map<string, DetectedImageType>(
  (
    Object.entries(IMAGE_TYPE_EXTENSIONS) as [DetectedImageType, string[]][]
  ).flatMap(([type, extensions]) =>
    extensions.map((extension) => [extension, type] as const)
  )
)
/** MIME 타입 → 이미지 형식. */
export const TYPE_BY_MIME = new Map<string, DetectedImageType>(
  (Object.entries(IMAGE_TYPE_MIME) as [DetectedImageType, string][]).map(
    ([type, mime]) => [mime, type] as const
  )
)

/** 대상별 업로드 권한: 프로필은 본인 정보 수정 권한, 세션·프로젝트는 생성 권한. */
export function authorizeTarget(
  actor: Actor,
  target: ImageTarget
): ServiceResult<void> {
  return target === 'users'
    ? authorize(actor, 'put', 'members', actor.userId)
    : authorize(actor, 'post', target)
}

/** `{대상}/{UUID}.{확장자}` 형식의 새 객체 키. */
export function newObjectKey(target: ImageTarget, type: DetectedImageType) {
  return `${target}/${crypto.randomUUID()}.${IMAGE_TYPE_EXTENSIONS[type][0]}`
}
