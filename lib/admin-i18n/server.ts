/**
 * 관리자 화면 언어 결정(서버 전용). proxy가 붙인 헤더, 쿠키, 기본 언어 순으로 본다.
 */
import 'server-only'

import { cookies, headers } from 'next/headers'
import { i18n, isLocale, type Locale } from '@/lib/i18n'
import { ADMIN_LOCALE_COOKIE } from '@/lib/admin-i18n'
import { localizeAdminHref } from '@/lib/admin-i18n'

export * from '@/lib/admin-i18n'

/**
 * 현재 요청의 관리자 화면 언어.
 * `/ko/admin/...` 경로는 proxy가 `/admin/...`으로 바꾸면서 `x-admin-locale` 헤더로 언어를 넘긴다.
 */
export async function getAdminLocale(): Promise<Locale> {
  const headerStore = await headers()
  const localeFromHeader = headerStore.get('x-admin-locale')
  if (isLocale(localeFromHeader)) {
    return localeFromHeader
  }

  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(ADMIN_LOCALE_COOKIE)?.value

  if (isLocale(cookieLocale)) {
    return cookieLocale
  }

  return i18n.defaultLocale
}

/** `/admin` 경로에 현재 언어를 붙인다(Server Action의 redirect용). */
export async function getLocalizedAdminPath(path: string): Promise<string> {
  if (!path.startsWith('/admin')) {
    return path
  }

  try {
    return localizeAdminHref(path, await getAdminLocale())
  } catch {
    return path
  }
}
