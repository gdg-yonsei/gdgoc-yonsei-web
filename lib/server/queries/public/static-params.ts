import 'server-only'

import type { Locale } from '@/i18n-config'
import { getSessionVisibilityBucket } from '@/lib/server/cache/policy'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { getProjects } from '@/lib/server/queries/public/projects'
import { getPublishedSessionsForSitemap } from '@/lib/server/queries/public/sessions'

const EMPTY_STATIC_PARAM = '__empty__'

export async function getGenerationStaticParams(locale: Locale) {
  const generations = await getGenerationSummaries(locale)
  const params = generations.map(({ name }) => ({ generation: name }))

  return params.length > 0 ? params : [{ generation: EMPTY_STATIC_PARAM }]
}

export async function getProjectStaticParams(locale: Locale) {
  const projects = await getProjects(locale)
  const params = projects.map((project) => ({
    generation: project.generation.name,
    projectId: project.id,
  }))

  return params.length > 0
    ? params
    : [{ generation: EMPTY_STATIC_PARAM, projectId: EMPTY_STATIC_PARAM }]
}

export async function getSessionStaticParams(locale: Locale) {
  const visibilityBucket = getSessionVisibilityBucket()
  const sessions = await getPublishedSessionsForSitemap(
    locale,
    visibilityBucket
  )
  const params = sessions.flatMap((session) =>
    session.generationName
      ? [{ generation: session.generationName, sessionId: session.id }]
      : []
  )

  return params.length > 0
    ? params
    : [{ generation: EMPTY_STATIC_PARAM, sessionId: EMPTY_STATIC_PARAM }]
}
