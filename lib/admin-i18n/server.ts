import { cookies, headers } from 'next/headers'
import { Locale, i18n } from '@/i18n-config'
import { ADMIN_LOCALE_COOKIE } from '@/lib/admin-i18n'
import { localizeAdminHref } from '@/lib/admin-i18n'

export * from '@/lib/admin-i18n'

export async function getAdminLocale(): Promise<Locale> {
  const headerStore = await headers()
  const localeFromHeader = headerStore.get('x-admin-locale')
  if (
    localeFromHeader &&
    i18n.locales.includes(localeFromHeader as Locale)
  ) {
    return localeFromHeader as Locale
  }

  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(ADMIN_LOCALE_COOKIE)?.value

  if (
    cookieLocale &&
    i18n.locales.includes(cookieLocale as Locale)
  ) {
    return cookieLocale as Locale
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
