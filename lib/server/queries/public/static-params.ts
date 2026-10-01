import 'server-only'

import { getSessionVisibilityBucket } from '@/lib/server/cache/policy'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { getProjects } from '@/lib/server/queries/public/projects'
import { getPublishedSessionsForSitemap } from '@/lib/server/queries/public/sessions'
import { sessionWallClockNow } from '@/lib/site/datetime'

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
  // Same wall-clock bucket as the session pages and the proxy route check.
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
