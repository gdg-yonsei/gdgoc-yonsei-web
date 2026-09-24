import { i18n, type Locale } from '@/i18n-config'

/** Swaps (or adds) the locale segment so a language switch keeps the page. */
export function localizedPath(pathname: string | null, locale: Locale): string {
  if (!pathname || pathname === '/') return `/${locale}`

  const segments = pathname.split('/')
  if ((i18n.locales as readonly string[]).includes(segments[1] ?? '')) {
    segments[1] = locale
    return segments.join('/')
  }

  return `/${locale}${pathname}`
}
