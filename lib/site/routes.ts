// *Path는 언어 없는 경로를 반환한다. 화면 링크는 localeHref로 언어를 붙인다.
// 페이지·사이트맵·JSON-LD·캐시 무효화가 공유하므로 클라이언트에서도 읽을 수 있어야 한다.
import type { Locale } from '@/lib/i18n'

export type ArchiveSection = 'session' | 'project' | 'member'

/** 언어가 붙지 않은 공개 경로. 빈 문자열은 홈을 뜻한다. */
export type SitePath = '' | `/${string}`

export function generationPath(
  section: ArchiveSection,
  generation: string
): SitePath {
  return `/${section}/${generation}`
}

export function sessionPath(generation: string, sessionId: string): SitePath {
  return `/session/${generation}/${sessionId}`
}

export function projectPath(generation: string, projectId: string): SitePath {
  return `/project/${generation}/${projectId}`
}

export function localeHref(lang: Locale, path: SitePath = ''): string {
  return `/${lang}${path}`
}
