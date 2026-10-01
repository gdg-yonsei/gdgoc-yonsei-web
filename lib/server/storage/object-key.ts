/**
 * R2 이미지 객체 키와 공개 URL 규칙.
 *
 * 관리자 폼과 MCP 도구는 이미지 필드에 "공개 URL"을 저장하고, R2 작업에는 "객체 키"
 * (`projects/{uuid}.png`)가 필요하다. 둘 사이 변환과 안전성 검사(경로 조작, 허용
 * 확장자, 리소스별 접두사)를 이 파일 한 곳에서 처리한다.
 */
import 'server-only'

import { joinImageUrl } from '@/lib/image-url'
import { getImageEnv } from '@/lib/server/env'

/** 리소스별 R2 객체 키 접두사. 다른 리소스의 이미지를 지우지 못하도록 키 검사에 쓴다. */
export type R2ImagePrefix = 'projects' | 'sessions' | 'users'

/** 업로드를 허용하는 이미지 확장자. */

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'avif',
  'svg',
])

/** 끝 슬래시를 뗀 공개 이미지 기본 URL(`NEXT_PUBLIC_IMAGE_URL`). */
function getBaseImageUrlWithoutTrailingSlash(): string {
  return getImageEnv().NEXT_PUBLIC_IMAGE_URL.trim().replace(/\/+$/, '')
}

/** 객체 키를 브라우저에서 접근 가능한 공개 URL로 바꾼다. */
export function publicImageUrl(objectKey: string): string {
  return joinImageUrl(getImageEnv().NEXT_PUBLIC_IMAGE_URL, objectKey)
}

/**
 * 사용자가 보낸 파일 이름에서 안전한 확장자만 꺼낸다.
 * 경로 구분자나 널 문자가 있거나 허용 목록에 없는 확장자면 `null`을 반환한다.
 */
export function getSafeImageExtension(fileName: string): string | null {
  const trimmedFileName = fileName.trim()

  if (!trimmedFileName) {
    return null
  }

  if (
    trimmedFileName.includes('/') ||
    trimmedFileName.includes('\\') ||
    trimmedFileName.includes('\0')
  ) {
    return null
  }

  const extension = trimmedFileName.split('.').pop()?.toLowerCase()
  if (!extension || extension === trimmedFileName.toLowerCase()) {
    return null
  }

  if (!/^[a-z0-9]+$/.test(extension)) {
    return null
  }

  if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    return null
  }

  return extension
}

/**
 * 공개 URL이나 객체 키를 검증된 객체 키로 정규화한다.
 *
 * 우리 버킷 URL이 아니거나, 지정한 접두사 밖을 가리키거나, `..`처럼 경로를 벗어나는
 * 입력은 모두 `null`을 반환한다. 삭제 대상 키는 반드시 이 함수를 거쳐야 한다.
 */
export function normalizeR2ImageObjectKey(
  input: string,
  prefix: R2ImagePrefix
): string | null {
  let keyCandidate = input.trim()
  if (!keyCandidate) {
    return null
  }

  if (keyCandidate.includes('\0') || keyCandidate.includes('\\')) {
    return null
  }

  // URL의 쿼리와 해시는 객체 키에 포함되지 않으므로 버린다.
  keyCandidate = keyCandidate.split(/[?#]/)[0] ?? ''

  const publicImageBaseUrl = getBaseImageUrlWithoutTrailingSlash()
  if (/^https?:\/\//i.test(keyCandidate)) {
    if (!keyCandidate.startsWith(publicImageBaseUrl)) {
      return null
    }
    keyCandidate = keyCandidate.slice(publicImageBaseUrl.length)
  } else if (keyCandidate.startsWith(publicImageBaseUrl)) {
    keyCandidate = keyCandidate.slice(publicImageBaseUrl.length)
  }

  const normalizedKey = keyCandidate.replace(/^\/+/, '')
  if (!normalizedKey) {
    return null
  }

  if (!normalizedKey.startsWith(`${prefix}/`)) {
    return null
  }

  if (normalizedKey.includes('..') || normalizedKey.includes('//')) {
    return null
  }

  if (!/^[A-Za-z0-9/_\-.]+$/.test(normalizedKey)) {
    return null
  }

  const extension = normalizedKey.split('.').pop()?.toLowerCase()
  if (!extension || !ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    return null
  }

  return normalizedKey
}
