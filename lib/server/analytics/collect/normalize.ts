/** 저장 전에 경로·언어·리퍼러를 같은 모양으로 맞춘다. 쿼리에는 개인정보가 섞일 수 있어 저장하지 않는다. */
import 'server-only'

import { isLocale } from '@/lib/i18n'

/** 쿼리·해시와 끝 슬래시를 뗀다. 같은 페이지가 여러 행으로 갈라지지 않게 한다. */
export function normalizePath(path: string): string {
  const withoutQuery = path.split(/[?#]/, 1)[0] ?? '/'
  const trimmed = withoutQuery.replace(/\/+$/, '')
  return (trimmed || '/').slice(0, 512)
}

/** 공개 페이지는 첫 경로 조각이 언어다. 전역 404처럼 언어가 없는 경로는 `other`. */
export function localeFromPath(path: string): string {
  const segment = path.split('/')[1]
  return isLocale(segment) ? segment : 'other'
}

/** 외부 웹 리퍼러만 남긴다. 같은 사이트, 앱 스킴, 해석할 수 없는 값은 리퍼러가 없는 것으로 본다. */
export function parseReferrer(
  referrer: string | undefined,
  siteHost: string
): { host: string; path: string } | null {
  if (!referrer) return null
  let url: URL
  try {
    url = new URL(referrer)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  if (host === siteHost.toLowerCase().replace(/^www\./, '')) return null
  return { host, path: url.pathname.slice(0, 512) }
}
