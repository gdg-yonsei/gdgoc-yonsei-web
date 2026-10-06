// Action은 updateTag로 즉시 만료한다. Handler는 revalidateTag(tag, { expire: 0 })로 대체한다.
import 'server-only'

import { revalidatePath, revalidateTag, updateTag } from 'next/cache'
import type { Locale } from '@/lib/i18n'
import { i18n } from '@/lib/i18n'
import { isRouteHandlerInvalidation } from '@/lib/server/cache/invalidation-context'

export type LocalizedPublicRoute = `/${string}`

export function uniqueStrings(
  values: readonly (string | null | undefined)[]
): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

function normalizeTags(tags: readonly string[] | string): string[] {
  return typeof tags === 'string' ? [tags] : uniqueStrings(tags)
}

/** 태그를 즉시 만료시킨다. 다음 요청은 새 데이터를 기다려 받는다. */
export function updateCacheTags(tags: readonly string[] | string) {
  const routeHandler = isRouteHandlerInvalidation()
  for (const tag of normalizeTags(tags)) {
    if (routeHandler) {
      revalidateTag(tag, { expire: 0 })
    } else {
      updateTag(tag)
    }
  }
}

/** 태그를 오래된 것으로 표시한다. 다음 요청은 기존 캐시를 받고 백그라운드에서 갱신된다. */
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
