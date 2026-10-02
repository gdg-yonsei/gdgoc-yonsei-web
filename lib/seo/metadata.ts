/**
 * 페이지 메타데이터(SEO) 헬퍼: 절대 URL, 언어별 대체 링크, 설명 요약, 공통 메타데이터.
 *
 * 모든 공개 페이지의 `generateMetadata`가 `createLocalizedMetadata`로 캐노니컬 URL,
 * hreflang, Open Graph, Twitter 카드를 같은 규칙으로 만든다.
 */
import 'server-only'

import type { Metadata } from 'next'
import { i18n, type Locale } from '@/lib/i18n'
import { getSiteEnv } from '@/lib/server/env'

/** Open Graph `og:locale` 값. */
const OPEN_GRAPH_LOCALES: Record<Locale, string> = {
  en: 'en_US',
  ko: 'ko_KR',
}

/** 앞뒤 슬래시를 정리해 `/a/b` 또는 빈 문자열로 맞춘다. */
function normalizePath(path: string): string {
  const trimmedPath = path.trim().replace(/^\/+|\/+$/g, '')
  return trimmedPath ? `/${trimmedPath}` : ''
}

/** 사이트 주소(`NEXT_PUBLIC_SITE_URL`) 기준 절대 URL. */
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

/** 언어 세그먼트를 붙인 절대 URL(`https://…/ko/session`). */
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

/**
 * 마크다운·HTML 본문을 메타 설명용 평문으로 바꾸고 `maxLength`자로 줄인다.
 * 본문이 비어 있으면 `fallback`을 쓴다. 단어 중간에서 자르지 않도록 가능하면 공백에서 끊는다.
 */
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

/**
 * 공통 메타데이터 입력.
 * - path: 언어 없는 경로(캐노니컬·대체 링크 계산용)
 * - absoluteTitle: true면 레이아웃의 제목 템플릿(`%s | GDGoC Yonsei`)을 붙이지 않는다
 * - image / generatedSocialImage: 소셜 이미지. 생성 이미지 라우트가 있으면 직접 지정하지 않는다
 * - noindex: 검색 색인에서 뺄지
 */
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

/** 언어별 페이지 메타데이터를 만든다. */
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
