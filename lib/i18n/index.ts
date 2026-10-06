export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'ko'],
} as const

export type Locale = (typeof i18n)['locales'][number]

// Cache Components는 정적 파라미터가 하나 이상 필요하므로 모든 지원 언어를 반환한다.
export function localeStaticParams(): { lang: Locale }[] {
  return i18n.locales.map((lang) => ({ lang }))
}

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === 'string' &&
    (i18n.locales as readonly string[]).includes(value)
  )
}

// 지원하지 않는 언어 값은 기본 언어(영어)로 처리한다.
export function toLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : i18n.defaultLocale
}

export function toIntlLocale(locale: Locale): string {
  return locale === 'ko' ? 'ko-KR' : 'en-US'
}

export type LocalizedPair<T> = {
  en: T | null | undefined
  ko: T | null | undefined
}

// 한 언어만 입력한 콘텐츠는 다른 언어로 폴백한다. 둘 다 비면 null을 반환한다.
export function pickLocalized<T>(
  locale: Locale,
  values: LocalizedPair<T>
): T | null {
  const [primary, fallback] =
    locale === 'ko' ? [values.ko, values.en] : [values.en, values.ko]
  return primary || fallback || null
}

// 언어 전환 시 현재 페이지를 유지하도록 첫 언어 세그먼트를 바꾸거나 붙인다.
export function localizedPath(pathname: string | null, locale: Locale): string {
  if (!pathname || pathname === '/') return `/${locale}`

  const segments = pathname.split('/')
  if (isLocale(segments[1])) {
    segments[1] = locale
    return segments.join('/')
  }

  return `/${locale}${pathname}`
}
