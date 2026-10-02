/**
 * 공개 캐시 태그 이름 규칙.
 *
 * 태그 이름은 이 파일의 함수로만 만든다(직접 문자열을 쓰지 않는다).
 * - 언어는 항상 마지막 세그먼트: `<resource>[:scope][:id]:<locale>`
 * - 목록 태그: `project:list:ko`처럼 고정 범위
 * - 상세 태그: `project:item:<id>:ko`처럼 식별자 포함
 * - 기수 단위 태그: `session:generation:<기수>:en`
 *
 * 캐시 데이터 자체는 두 언어 필드를 모두 담아 언어와 무관하게 하나지만, 기존 무효화
 * 규칙을 지키려고 언어별 태그를 모두 단다(`forEachPublicLocale`).
 * `next.config.ts`에서 간접 import될 수 있어 `server-only`를 쓰지 않는다.
 */
import type { Locale } from '@/lib/i18n'
import { i18n } from '@/lib/i18n'

type TagPart = string | number

/** 태그를 만들 공개 사이트 언어 목록. */
export const publicLocales = [...i18n.locales] as Locale[]

/** 태그 세그먼트에 `:` 등 구분자가 섞이지 않도록 URL 인코딩한다. */
function normalizeTagPart(value: TagPart): string {
  return encodeURIComponent(String(value))
}

function buildLocaleTag(locale: Locale, ...parts: readonly TagPart[]): string {
  return [...parts.map(normalizeTagPart), locale].join(':')
}

/** 홈 화면 태그. */
export function homeTag(locale: Locale): string {
  return buildLocaleTag(locale, 'home')
}

/** 기수 목록 태그. */
export function generationListTag(locale: Locale): string {
  return buildLocaleTag(locale, 'generation', 'list')
}

/** 최신 기수 태그(최신 기수를 쓰는 화면용). */
export function generationLatestTag(locale: Locale): string {
  return buildLocaleTag(locale, 'generation', 'latest')
}

/** 구성원 목록(기수 인덱스) 태그. */
export function memberListTag(locale: Locale): string {
  return buildLocaleTag(locale, 'member', 'list')
}

/** 특정 기수 구성원 디렉터리 태그. */
export function memberGenerationTag(
  generationName: string,
  locale: Locale
): string {
  return buildLocaleTag(locale, 'member', 'generation', generationName)
}

/** 구성원 한 명 태그. */
export function memberTag(memberId: string, locale: Locale): string {
  return buildLocaleTag(locale, 'member', 'item', memberId)
}

/** 프로젝트 쇼케이스 전체 태그. */
export function projectListTag(locale: Locale): string {
  return buildLocaleTag(locale, 'project', 'list')
}

/** 특정 기수 프로젝트 목록 태그. */
export function projectGenerationTag(
  generationName: string,
  locale: Locale
): string {
  return buildLocaleTag(locale, 'project', 'generation', generationName)
}

/** 프로젝트 상세 태그. */
export function projectTag(projectId: string, locale: Locale): string {
  return buildLocaleTag(locale, 'project', 'item', projectId)
}

/** 세션 기록 전체 태그. */
export function sessionListTag(locale: Locale): string {
  return buildLocaleTag(locale, 'session', 'list')
}

/** 특정 기수 세션 기록 태그. */
export function sessionGenerationTag(
  generationName: string,
  locale: Locale
): string {
  return buildLocaleTag(locale, 'session', 'generation', generationName)
}

/** 세션 상세 태그. */
export function sessionTag(sessionId: string, locale: Locale): string {
  return buildLocaleTag(locale, 'session', 'item', sessionId)
}

/** 사이트맵 태그. */
export function sitemapTag(locale: Locale): string {
  return buildLocaleTag(locale, 'sitemap')
}

/** 모든 공개 언어에 대해 태그를 만들어 한 배열로 합친다. */
export function forEachPublicLocale(
  buildTags: (locale: Locale) => readonly string[]
): string[] {
  return publicLocales.flatMap((locale) => buildTags(locale))
}
