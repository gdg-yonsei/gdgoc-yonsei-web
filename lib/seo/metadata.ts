import 'server-only'

import type { Metadata } from 'next'
import { i18n, type Locale } from '@/i18n-config'
import { getSiteEnv } from '@/lib/server/env'

const OPEN_GRAPH_LOCALES: Record<Locale, string> = {
  en: 'en_US',
  ko: 'ko_KR',
}

function normalizePath(path: string): string {
  const trimmedPath = path.trim().replace(/^\/+|\/+$/g, '')
  return trimmedPath ? `/${trimmedPath}` : ''
}

export function getSiteUrl(path = ''): string {
  const { NEXT_PUBLIC_SITE_URL } = getSiteEnv()
  return new URL(normalizePath(path) || '/', NEXT_PUBLIC_SITE_URL).toString()
}

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

export function getLanguageAlternates(path = ''): Record<string, string> {
  const languageAlternates = Object.fromEntries(
    i18n.locales.map((locale) => [locale, getLocalizedUrl(locale, path)])
  )

  return {
    ...languageAlternates,
    'x-default': getLocalizedUrl(i18n.defaultLocale, path),
  }
}

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

type LocalizedMetadataInput = {
  locale: Locale
  path?: string
  title: string
  description: string
  absoluteTitle?: boolean
  image?: string
  generatedSocialImage?: boolean
}

export function createLocalizedMetadata({
  locale,
  path = '',
  title,
  description,
  absoluteTitle = false,
  image,
  generatedSocialImage = false,
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
    robots: {
      index: true,
      follow: true,
    },
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
