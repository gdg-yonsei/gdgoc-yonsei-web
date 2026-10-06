import 'server-only'

import type { Metadata, Viewport } from 'next'
import { i18n, type Locale } from '@/lib/i18n'
import { getSiteEnv } from '@/lib/server/env'

const OPEN_GRAPH_LOCALES: Record<Locale, string> = {
  en: 'en_US',
  ko: 'ko_KR',
}

// 공통 상위 레이아웃이 없으므로 각 루트 레이아웃이 이 메타데이터를 펼쳐 쓴다.
export function rootMetadata(): Metadata {
  return {
    metadataBase: new URL(getSiteEnv().NEXT_PUBLIC_SITE_URL),
    applicationName: 'GDGoC Yonsei',
    creator: 'GDGoC Yonsei',
    publisher: 'GDGoC Yonsei',
    category: 'technology',
    referrer: 'origin-when-cross-origin',
  }
}

export const rootViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

function normalizePath(path: string): string {
  const trimmedPath = path.trim().replace(/^\/+|\/+$/g, '')
  return trimmedPath ? `/${trimmedPath}` : ''
}

export function getSiteUrl(path = ''): string {
  const { NEXT_PUBLIC_SITE_URL } = getSiteEnv()
  return new URL(normalizePath(path) || '/', NEXT_PUBLIC_SITE_URL).toString()
}

/** 이미 절대 URL이면 그대로, 경로면 사이트 주소를 붙인다. */
export function getAbsoluteUrl(urlOrPath: string): string {
  try {
    return new URL(urlOrPath).toString()
  } catch {
    return getSiteUrl(urlOrPath)
  }
}

export function getLocalizedUrl(locale: Locale, path = ''): string {
  return getSiteUrl(`/${locale}${normalizePath(path)}`)
}

/** hreflang 대체 링크(언어별 URL + 기본 언어용 `x-default`). */
export function getLanguageAlternates(path = ''): Record<string, string> {
  const languageAlternates = Object.fromEntries(
    i18n.locales.map((locale) => [locale, getLocalizedUrl(locale, path)])
  )

  return {
    ...languageAlternates,
    'x-default': getLocalizedUrl(i18n.defaultLocale, path),
  }
}

// 본문이 비면 fallback을 쓰고, 설명을 줄일 때 가능하면 공백에서 끊어 단어를 보존한다.
export function summarizeForMetadata(
  value: string | null | undefined,
  fallback: string,
  maxLength = 160
): string {
  const normalized = (value || fallback)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[`#>*_~|{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (normalized.length <= maxLength) {
    return normalized
  }

  const shortened = normalized.slice(0, Math.max(1, maxLength - 1)).trimEnd()
  const lastSpace = shortened.lastIndexOf(' ')
  const withoutPartialWord =
    lastSpace >= maxLength * 0.65 ? shortened.slice(0, lastSpace) : shortened

  return `${withoutPartialWord.trimEnd()}…`
}

// path는 언어 없는 경로다. absoluteTitle은 제목 템플릿을 생략한다.
// 생성 이미지 라우트가 있으면 이미지 URL을 직접 지정하지 않는다.
type LocalizedMetadataInput = {
  locale: Locale
  path?: string
  title: string
  description: string
  absoluteTitle?: boolean
  image?: string
  generatedSocialImage?: boolean
  noindex?: boolean
}

export function createLocalizedMetadata({
  locale,
  path = '',
  title,
  description,
  absoluteTitle = false,
  image,
  generatedSocialImage = false,
  noindex = false,
}: LocalizedMetadataInput): Metadata {
  const canonical = getLocalizedUrl(locale, path)
  const openGraphImageUrl = getAbsoluteUrl(image || '/opengraph-image.png')
  const twitterImageUrl = getAbsoluteUrl(image || '/twitter-image.png')

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical,
      languages: getLanguageAlternates(path),
    },
    // 공개 항목이 없는 기수 페이지는 접근은 되지만 검색 색인에서는 뺀다.
    robots: noindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      type: 'website',
      url: canonical,
      title,
      description,
      siteName: 'GDGoC Yonsei',
      locale: OPEN_GRAPH_LOCALES[locale],
      alternateLocale: i18n.locales
        .filter((candidate) => candidate !== locale)
        .map((candidate) => OPEN_GRAPH_LOCALES[candidate]),
      ...(generatedSocialImage ? {} : { images: [{ url: openGraphImageUrl }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(generatedSocialImage ? {} : { images: [twitterImageUrl] }),
    },
  }
}
