/**
 * 사이트 전체가 공유하는 다국어(i18n) 설정과 로케일 헬퍼.
 *
 * - 공개 사이트(`app/(home)/[lang]`), 관리자 화면(GYMS), proxy, 서버 코드가 모두
 *   이 모듈을 기준으로 지원 언어를 판단한다.
 * - 서버/클라이언트 어디서든 import할 수 있도록 순수 함수만 둔다.
 */

/** 지원 언어 목록과 기본 언어. 새 언어를 추가할 때는 이 객체부터 수정한다. */
export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'ko'],
} as const

/** 지원 언어 코드 유니온 타입 (`'en' | 'ko'`). */
export type Locale = (typeof i18n)['locales'][number]

/**
 * `[lang]` 세그먼트의 `generateStaticParams` 결과. 지원 언어마다 페이지를 미리 만든다.
 * Cache Components는 정적 파라미터가 하나 이상 있어야 하므로 각 페이지가 이 값을 돌려준다.
 */
export function localeStaticParams(): { lang: Locale }[] {
  return i18n.locales.map((lang) => ({ lang }))
}

/** 임의의 값이 지원 언어 코드인지 확인하는 타입 가드. */
export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === 'string' &&
    (i18n.locales as readonly string[]).includes(value)
  )
}

/**
 * URL 파라미터 등 신뢰할 수 없는 문자열을 지원 언어로 변환한다.
 * 지원하지 않는 값이면 기본 언어(영어)로 처리한다.
 */
export function toLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : i18n.defaultLocale
}

/** `Intl` API에 넘길 BCP 47 로케일 태그 (`ko-KR` / `en-US`). */
export function toIntlLocale(locale: Locale): string {
  return locale === 'ko' ? 'ko-KR' : 'en-US'
}

/** 언어별 값 쌍. DB의 `name` / `nameKo`처럼 영어·한국어 컬럼이 나뉜 데이터를 표현한다. */
export type LocalizedPair<T> = {
  en: T | null | undefined
  ko: T | null | undefined
}

/**
 * 현재 언어에 맞는 값을 고르고, 비어 있으면 다른 언어 값으로 대체한다.
 *
 * 관리자가 한쪽 언어만 입력한 콘텐츠도 화면이 비지 않도록 양방향으로 폴백한다.
 * 두 값이 모두 비어 있으면 `null`을 반환한다.
 */
export function pickLocalized<T>(
  locale: Locale,
  values: LocalizedPair<T>
): T | null {
  const [primary, fallback] =
    locale === 'ko' ? [values.ko, values.en] : [values.en, values.ko]
  return primary || fallback || null
}

/**
 * 경로의 첫 세그먼트(언어)를 바꾸거나 붙인다.
 * 언어 전환 링크가 현재 페이지를 유지한 채 언어만 바꾸도록 할 때 쓴다.
 *
 * @example localizedPath('/en/session', 'ko') // '/ko/session'
 */
export function localizedPath(pathname: string | null, locale: Locale): string {
  if (!pathname || pathname === '/') return `/${locale}`

  const segments = pathname.split('/')
  if (isLocale(segments[1])) {
    segments[1] = locale
    return segments.join('/')
  }

  return `/${locale}${pathname}`
}
