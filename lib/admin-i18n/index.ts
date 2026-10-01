/**
 * 관리자 화면(GYMS) 다국어 헬퍼.
 *
 * 공개 사이트는 `[lang]` 경로로 언어를 정하지만, 관리자 화면은 쿠키와 proxy가 붙인
 * `x-admin-locale` 헤더로 언어를 정한다(`server.ts`의 `getAdminLocale`).
 * 문구 사전은 `messages/en.ts`, `messages/ko.ts`에 있다.
 * 서버·클라이언트 양쪽에서 쓰므로 서버 전용 API는 `server.ts`에 둔다.
 */
import { toIntlLocale, type Locale } from '@/lib/i18n'
import { en } from '@/lib/admin-i18n/messages/en'
import { ko } from '@/lib/admin-i18n/messages/ko'

/** 관리자 화면 언어를 기억하는 쿠키 이름. proxy와 언어 전환 버튼이 함께 쓴다. */
export const ADMIN_LOCALE_COOKIE = 'admin-locale'

/** 관리자 번역 키. 영어 사전의 키 목록이 기준이다. */
export type AdminMessageKey = keyof typeof en

/** 한 언어의 관리자 문구 사전. */
export type AdminMessages = Record<AdminMessageKey, string>

const adminMessages: Record<Locale, AdminMessages> = { en, ko }

/** 언어에 맞는 관리자 문구 사전을 돌려준다. */
export function getAdminMessages(locale: Locale): AdminMessages {
  return adminMessages[locale]
}

/**
 * `/admin` 경로 앞에 언어를 붙인다(`/admin/parts` → `/ko/admin/parts`).
 * proxy가 이 경로를 다시 `/admin/...`으로 rewrite하면서 언어를 헤더로 넘긴다.
 * 관리자 경로가 아니면 그대로 돌려준다.
 */
export function localizeAdminHref(href: string, locale: Locale): string {
  if (!href.startsWith('/admin')) {
    return href
  }
  return `/${locale}${href}`
}

/** 관리자 화면 날짜 표시. 표시 형식과 타임존은 호출부가 정한다. */
export function formatAdminDate(
  value: string | Date,
  locale: Locale,
  options: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(toIntlLocale(locale), options).format(
    typeof value === 'string' ? new Date(value) : value
  )
}
