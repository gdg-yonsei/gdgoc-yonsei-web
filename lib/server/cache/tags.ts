// 태그는 <resource>[:scope][:id]:<locale>다. 언어 공용 데이터에도 두 언어 태그를 모두 붙인다.
// next.config가 간접 import하므로 server-only를 붙이지 않는다.
import type { Locale } from '@/lib/i18n'
import { i18n } from '@/lib/i18n'

type TagPart = string | number

export const publicLocales = [...i18n.locales] as Locale[]

/** 태그 세그먼트에 `:` 등 구분자가 섞이지 않도록 URL 인코딩한다. */
function normalizeTagPart(value: TagPart): string {
  return encodeURIComponent(String(value))
}

function buildLocaleTag(locale: Locale, ...parts: readonly TagPart[]): string {
  return [...parts.map(normalizeTagPart), locale].join(':')
}

export function homeTag(locale: Locale): string {
  return buildLocaleTag(locale, 'home')
}

export function generationListTag(locale: Locale): string {
  return buildLocaleTag(locale, 'generation', 'list')
}

export function generationLatestTag(locale: Locale): string {
  return buildLocaleTag(locale, 'generation', 'latest')
}

export function memberListTag(locale: Locale): string {
  return buildLocaleTag(locale, 'member', 'list')
}

export function memberGenerationTag(
  generationName: string,
  locale: Locale
): string {
  return buildLocaleTag(locale, 'member', 'generation', generationName)
}

export function memberTag(memberId: string, locale: Locale): string {
  return buildLocaleTag(locale, 'member', 'item', memberId)
}

export function projectListTag(locale: Locale): string {
  return buildLocaleTag(locale, 'project', 'list')
}

export function projectGenerationTag(
  generationName: string,
  locale: Locale
): string {
  return buildLocaleTag(locale, 'project', 'generation', generationName)
}

// 공용 상세 태그로 ID 조회 없이 모든 프로젝트 상세 캐시를 새로고침한다.
export function projectDetailsTag(locale: Locale): string {
  return buildLocaleTag(locale, 'project', 'items')
}

export function projectTag(projectId: string, locale: Locale): string {
  return buildLocaleTag(locale, 'project', 'item', projectId)
}

export function sessionListTag(locale: Locale): string {
  return buildLocaleTag(locale, 'session', 'list')
}

export function sessionGenerationTag(
  generationName: string,
  locale: Locale
): string {
  return buildLocaleTag(locale, 'session', 'generation', generationName)
}

/** 모든 세션 상세에 함께 다는 태그(`projectDetailsTag`와 같은 용도). */
export function sessionDetailsTag(locale: Locale): string {
  return buildLocaleTag(locale, 'session', 'items')
}

export function sessionTag(sessionId: string, locale: Locale): string {
  return buildLocaleTag(locale, 'session', 'item', sessionId)
}

export function sitemapTag(locale: Locale): string {
  return buildLocaleTag(locale, 'sitemap')
}

export function forEachPublicLocale(
  buildTags: (locale: Locale) => readonly string[]
): string[] {
  return publicLocales.flatMap((locale) => buildTags(locale))
}
