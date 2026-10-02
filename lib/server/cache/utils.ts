/**
 * 캐시 무효화 저수준 헬퍼.
 *
 * Server Action에서는 `updateTag`로 즉시 만료시키고, Route Handler(MCP)에서는
 * `updateTag`를 쓸 수 없으므로 `revalidateTag(tag, { expire: 0 })`로 바꿔 부른다.
 */
import 'server-only'

import { revalidatePath, revalidateTag, updateTag } from 'next/cache'
import type { Locale } from '@/lib/i18n'
import { i18n } from '@/lib/i18n'
import { isRouteHandlerInvalidation } from '@/lib/server/cache/invalidation-context'

/** 언어 세그먼트를 붙이기 전의 공개 경로(`/session/25-26` 등). */
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

/** 단일 태그나 태그 목록을 중복 없는 배열로 맞춘다. */
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

/** 문자열을 공개 경로 타입으로 표시한다. */
export function toLocalizedPublicRoute(pathname: string): LocalizedPublicRoute {
  return pathname as LocalizedPublicRoute
}

/** 공개 경로 앞에 언어 세그먼트를 붙인다. */
function publicPath(
  pathname: LocalizedPublicRoute,
  locale: Locale
): LocalizedPublicRoute {
  return toLocalizedPublicRoute(`/${locale}${pathname}`)
}

/** 경로 목록을 모든 공개 언어로 펼친다(`/project` → `/en/project`, `/ko/project`). */
export function localizedPublicPaths(
  pathnames: readonly LocalizedPublicRoute[]
): string[] {
  return i18n.locales.flatMap((locale) =>
    pathnames.map((pathname) => publicPath(pathname, locale))
  )
}

/** 경로별 라우터 캐시와 전체 페이지 캐시를 무효화한다. */
export function revalidateLocalizedPublicPaths(paths: readonly string[]) {
  for (const path of uniqueStrings(paths)) {
    revalidatePath(path)
  }
}
