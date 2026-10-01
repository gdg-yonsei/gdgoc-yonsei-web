import 'server-only'

import { revalidatePath, revalidateTag, updateTag } from 'next/cache'
import type { Locale } from '@/lib/i18n'
import { i18n } from '@/lib/i18n'
import { isRouteHandlerInvalidation } from '@/lib/server/cache/invalidation-context'

export type LocalizedPublicRoute = `/${string}`

/**
 * 빈 값(`null`, `undefined`, 빈 문자열)을 빼고 중복을 제거한 문자열 목록을 만든다.
 * 캐시 태그나 기수 이름 목록처럼 선택적 값이 섞인 배열을 정리할 때 쓴다.
 */
export function uniqueStrings(
  values: readonly (string | null | undefined)[]
): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

function normalizeTags(tags: readonly string[] | string): string[] {
  return typeof tags === 'string' ? [tags] : uniqueStrings(tags)
}

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
