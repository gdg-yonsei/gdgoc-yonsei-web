import 'server-only'

import { revalidatePath, revalidateTag, updateTag } from 'next/cache'
import type { Locale } from '@/i18n-config'
import { i18n } from '@/i18n-config'

export type LocalizedPublicRoute = `/${string}`

export function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function normalizeTags(tags: readonly string[] | string): string[] {
  return typeof tags === 'string' ? [tags] : uniqueStrings(tags)
}

export function updateCacheTags(tags: readonly string[] | string) {
  for (const tag of normalizeTags(tags)) {
    updateTag(tag)
  }
}

export function revalidateCacheTags(tags: readonly string[] | string) {
  for (const tag of normalizeTags(tags)) {
    revalidateTag(tag, 'max')
  }
}

export function toLocalizedPublicRoute(pathname: string): LocalizedPublicRoute {
  return pathname as LocalizedPublicRoute
}

function publicPath(
  pathname: LocalizedPublicRoute,
  locale: Locale
): LocalizedPublicRoute {
  return toLocalizedPublicRoute(`/${locale}${pathname}`)
}

export function localizedPublicPath(pathname: `/${string}`): string[] {
  return i18n.locales.map((locale) => publicPath(pathname, locale))
}

export function localizedPublicPaths(
  pathnames: readonly LocalizedPublicRoute[]
): string[] {
  return i18n.locales.flatMap((locale) =>
    pathnames.map((pathname) => publicPath(pathname, locale))
  )
}

export function revalidateLocalizedPublicPaths(paths: readonly string[]) {
  for (const path of uniqueStrings(paths)) {
    revalidatePath(path)
  }
}
