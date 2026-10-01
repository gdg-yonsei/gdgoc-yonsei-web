/**
 * 공개 사이트 URL 경로 빌더.
 *
 * 기수 페이지와 상세 페이지 경로(`/session/{기수}/{id}` 등)는 페이지, 사이트맵,
 * JSON-LD, 캐시 무효화가 모두 같은 형태를 써야 한다. 한 곳에서 만들어야 경로
 * 규칙이 바뀌어도 어긋나지 않는다.
 *
 * - `*Path` 함수는 언어 세그먼트가 없는 경로를 반환한다. 메타데이터나 캐시
 *   무효화처럼 언어를 따로 붙이는 곳에서 쓴다.
 * - 화면 링크에는 `localeHref(lang, path)`로 언어를 붙여 쓴다.
 * - 클라이언트 컴포넌트에서도 쓰므로 서버 전용 모듈을 import하지 않는다.
 */
import type { Locale } from '@/lib/i18n'

/** 기수별 아카이브가 있는 공개 섹션. */
export type ArchiveSection = 'session' | 'project' | 'member'

/** 언어가 붙지 않은 공개 경로. 빈 문자열은 홈을 뜻한다. */
export type SitePath = '' | `/${string}`

/** 기수 아카이브 경로. 예: `/session/25-26` */
export function generationPath(
  section: ArchiveSection,
  generation: string
): SitePath {
  return `/${section}/${generation}`
}

/** 세션 상세 경로. 예: `/session/25-26/{sessionId}` */
export function sessionPath(generation: string, sessionId: string): SitePath {
  return `/session/${generation}/${sessionId}`
}

/** 프로젝트 상세 경로. 예: `/project/25-26/{projectId}` */
export function projectPath(generation: string, projectId: string): SitePath {
  return `/project/${generation}/${projectId}`
}

/** 경로 앞에 언어 세그먼트를 붙인 링크 주소를 만든다. 예: `/ko/session` */
export function localeHref(lang: Locale, path: SitePath = ''): string {
  return `/${lang}${path}`
}
