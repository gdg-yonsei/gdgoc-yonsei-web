// 관리자 언어는 쿠키·proxy x-admin-locale 헤더로 정한다. 서버 API는 server.ts에만 둔다.
import { toIntlLocale, type Locale } from '@/lib/i18n'
import { en } from '@/lib/admin-i18n/messages/en'
import { ko } from '@/lib/admin-i18n/messages/ko'

/** 관리자 화면 언어를 기억하는 쿠키 이름. proxy와 언어 전환 버튼이 함께 쓴다. */
export const ADMIN_LOCALE_COOKIE = 'admin-locale'

/** 관리자 번역 키. 영어 사전의 키 목록이 기준이다. */
export type AdminMessageKey = keyof typeof en

export type AdminMessages = Record<AdminMessageKey, string>

const adminMessages: Record<Locale, AdminMessages> = { en, ko }

export function getAdminMessages(locale: Locale): AdminMessages {
  return adminMessages[locale]
}

// 언어별 admin 링크는 proxy가 /admin으로 rewrite하며 언어를 헤더로 넘긴다. 관리자 밖 경로는 그대로다.
export function localizeAdminHref(href: string, locale: Locale): string {
  if (!href.startsWith('/admin')) {
    return href
  }
  return `/${locale}${href}`
}

export function formatAdminDate(
  value: string | Date,
  locale: Locale,
  options: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(toIntlLocale(locale), options).format(
    typeof value === 'string' ? new Date(value) : value
  )
}
