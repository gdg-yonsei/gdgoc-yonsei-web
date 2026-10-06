// 폼·MCP는 공개 이미지 URL을 저장하지만 R2 작업은 객체 키를 사용한다.
import 'server-only'

import { joinImageUrl } from '@/lib/image-url'
import { getImageEnv } from '@/lib/server/env'

/** 리소스별 R2 객체 키 접두사. 다른 리소스의 이미지를 지우지 못하도록 키 검사에 쓴다. */
export type R2ImagePrefix = 'projects' | 'sessions' | 'users'

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'avif',
  'svg',
])

function getBaseImageUrlWithoutTrailingSlash(): string {
  return getImageEnv().NEXT_PUBLIC_IMAGE_URL.trim().replace(/\/+$/, '')
}

export function publicImageUrl(objectKey: string): string {
  return joinImageUrl(getImageEnv().NEXT_PUBLIC_IMAGE_URL, objectKey)
}

// 파일명의 경로 구분자·널 문자·허용 목록 밖 확장자는 거절한다.
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

// 삭제 키는 반드시 정규화해야 한다. 다른 버킷·지정 접두사 밖·.. 경로 이탈은 null이다.
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
