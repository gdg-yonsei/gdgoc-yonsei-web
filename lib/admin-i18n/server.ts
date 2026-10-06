// 관리자 언어는 proxy 헤더, 쿠키, 기본 언어 순으로 정한다.
import 'server-only'

import { cookies, headers } from 'next/headers'
import { i18n, isLocale, type Locale } from '@/lib/i18n'
import { ADMIN_LOCALE_COOKIE } from '@/lib/admin-i18n'
import { localizeAdminHref } from '@/lib/admin-i18n'

export * from '@/lib/admin-i18n'

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
