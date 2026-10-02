/**
 * 동적 공개 라우트의 `generateStaticParams` 데이터.
 *
 * 빌드 시 미리 만들 기수·상세 페이지 목록을 돌려준다. Cache Components는 정적 파라미터가
 * 하나 이상 있어야 하므로, 데이터가 없으면 존재하지 않는 자리표시 값(`__empty__`)을
 * 돌려준다(그 페이지는 404가 된다).
 */
import 'server-only'

import { getSessionVisibilityBucket } from '@/lib/server/cache/policy'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { getProjects } from '@/lib/server/queries/public/projects'
import { getPublishedSessionsForSitemap } from '@/lib/server/queries/public/sessions'
import { sessionWallClockNow } from '@/lib/format/datetime'

/** 데이터가 없을 때 쓰는 자리표시 파라미터. */
const EMPTY_STATIC_PARAM = '__empty__'

/** 모든 기수 이름(`/session/[generation]` 등). */
export async function getGenerationStaticParams() {
  const generations = await getGenerationSummaries()
  const params = generations.map(({ name }) => ({ generation: name }))

  return params.length > 0 ? params : [{ generation: EMPTY_STATIC_PARAM }]
}

/** 모든 (기수, 프로젝트 ID) 쌍. */
export async function getProjectStaticParams() {
  const projects = await getProjects()
  const params = projects.map((project) => ({
    generation: project.generation.name,
    projectId: project.id,
  }))

  return params.length > 0
    ? params
    : [{ generation: EMPTY_STATIC_PARAM, projectId: EMPTY_STATIC_PARAM }]
}

/** 공개된 모든 (기수, 세션 ID) 쌍. */
export async function getSessionStaticParams() {
  // 세션 페이지와 proxy의 존재 확인이 쓰는 것과 같은 벽시계 버킷을 쓴다.
  const visibilityBucket = getSessionVisibilityBucket(sessionWallClockNow())
  const sessions = await getPublishedSessionsForSitemap(visibilityBucket)
  const params = sessions.flatMap((session) =>
    session.generationName
      ? [{ generation: session.generationName, sessionId: session.id }]
      : []
  )

  return params.length > 0
    ? params
    : [{ generation: EMPTY_STATIC_PARAM, sessionId: EMPTY_STATIC_PARAM }]
}
