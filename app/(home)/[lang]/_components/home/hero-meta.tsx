/**
 * 히어로 메타 정보 띠의 데이터 부분(서버 컴포넌트, 캐시된 공개 조회).
 */
import type { Locale } from '@/lib/i18n'
import { getCachedSessionVisibilityBucket } from '@/lib/server/cache/session-visibility'
import { getProjectShowcase } from '@/lib/server/queries/public/projects'
import { getSessionArchive } from '@/lib/server/queries/public/sessions'
import { HeroMetaList } from './hero'

/** 허브와 같은 읽기 모델에서 가져온 실시간 개수(세션·프로젝트·멤버 수). */
export default async function HeroMeta({ lang }: { lang: Locale }) {
  const visibilityBucket = await getCachedSessionVisibilityBucket()
  const [sessions, projects] = await Promise.all([
    getSessionArchive(visibilityBucket),
    getProjectShowcase(),
  ])
  const generations = new Set([
    ...sessions.map((session) => session.generationName),
    ...projects.map((project) => project.generationName),
  ]).size

  return (
    <HeroMetaList
      lang={lang}
      counts={{
        sessions: sessions.length,
        projects: projects.length,
        generations,
      }}
    />
  )
}
