// Cache Components는 정적 파라미터가 하나 이상 필요해 빈 데이터에는 __empty__를 반환한다(해당 페이지는 404).
import 'server-only'

import { getSessionVisibilityBucket } from '@/lib/server/cache/policy'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { getProjects } from '@/lib/server/queries/public/projects'
import { getPublishedSessionsForSitemap } from '@/lib/server/queries/public/sessions'
import { sessionWallClockNow } from '@/lib/format/datetime'

const EMPTY_STATIC_PARAM = '__empty__'

export async function getGenerationStaticParams() {
  const generations = await getGenerationSummaries()
  const params = generations.map(({ name }) => ({ generation: name }))

  return params.length > 0 ? params : [{ generation: EMPTY_STATIC_PARAM }]
}

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
