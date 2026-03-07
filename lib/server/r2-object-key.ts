import 'server-only'
import { getImageEnv } from '@/lib/server/env'

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'avif',
  'svg',
])

function getBaseImageUrlWithoutTrailingSlash(): string | null {
  const parsedImageEnv = getImageEnv()

  return parsedImageEnv.NEXT_PUBLIC_IMAGE_URL.trim().replace(/\/+$/, '')
}

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

export function normalizeR2ImageObjectKey(
  input: string,
  prefix: 'projects' | 'sessions' | 'users'
): string | null {
  let keyCandidate = input.trim()
  if (!keyCandidate) {
    return null
  }

  if (keyCandidate.includes('\0') || keyCandidate.includes('\\')) {
    return null
  }

  // Ignore URL query/hash fragments.
  keyCandidate = keyCandidate.split(/[?#]/)[0]

  const publicImageBaseUrl = getBaseImageUrlWithoutTrailingSlash()
  if (/^https?:\/\//i.test(keyCandidate)) {
    if (!publicImageBaseUrl || !keyCandidate.startsWith(publicImageBaseUrl)) {
      return null
    }
    keyCandidate = keyCandidate.slice(publicImageBaseUrl.length)
  } else if (publicImageBaseUrl && keyCandidate.startsWith(publicImageBaseUrl)) {
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
