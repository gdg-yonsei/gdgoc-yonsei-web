import type { Locale } from '@/i18n-config'
import { i18n } from '@/i18n-config'

type TagPart = string | number

export const publicLocales = [...i18n.locales] as Locale[]

function normalizeTagPart(value: TagPart): string {
  return encodeURIComponent(String(value))
}

function buildLocaleTag(locale: Locale, ...parts: readonly TagPart[]): string {
  return [...parts.map(normalizeTagPart), locale].join(':')
}

/**
 * Tag naming convention:
 * - Public read models are locale-scoped: `<resource>[:scope][:identifier]:<locale>`
 * - List tags use stable scopes like `project:list:ko`
 * - Detail tags use stable identifiers like `project:item:<id>:ko`
 * - Generation-bound read models include the generation slug:
 *   `session:generation:<generation>:en`
 */
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
