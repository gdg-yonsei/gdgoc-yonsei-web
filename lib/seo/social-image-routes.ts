import 'server-only'

import languageParamChecker from '@/lib/language-param-checker'
import {
  getProjectSocialImageContent,
  getSessionSocialImageContent,
  getSocialImageAlt,
} from '@/lib/seo/social-image-data'

export type SessionSocialImageParams = {
  lang: string
  generation: string
  sessionId: string
}

export type ProjectSocialImageParams = {
  lang: string
  generation: string
  projectId: string
}

function imageMetadata(version: string, alt: string) {
  return [
    {
      id: version,
      alt,
      size: { width: 1200, height: 630 },
      contentType: 'image/jpeg',
    },
  ]
}

export async function generateSessionSocialImageMetadata(
  params: SessionSocialImageParams
) {
  const content = await getSessionSocialImageContent({
    locale: languageParamChecker(params.lang),
    generation: params.generation,
    sessionId: params.sessionId,
  })

  return imageMetadata(content.version, getSocialImageAlt(content))
}

export async function renderSessionSocialImage(
  params: Promise<SessionSocialImageParams>,
  id: Promise<string | number>
) {
  const [{ lang, generation, sessionId }] = await Promise.all([params, id])
  const content = await getSessionSocialImageContent({
    locale: languageParamChecker(lang),
    generation,
    sessionId,
  })
  const { createSocialImageResponse } = await import('@/lib/seo/social-image')

  return createSocialImageResponse(content)
}

export async function generateProjectSocialImageMetadata(
  params: ProjectSocialImageParams
) {
  const content = await getProjectSocialImageContent({
    locale: languageParamChecker(params.lang),
    generation: params.generation,
    projectId: params.projectId,
  })

  return imageMetadata(content.version, getSocialImageAlt(content))
}

export async function renderProjectSocialImage(
  params: Promise<ProjectSocialImageParams>,
  id: Promise<string | number>
) {
  const [{ lang, generation, projectId }] = await Promise.all([params, id])
  const content = await getProjectSocialImageContent({
    locale: languageParamChecker(lang),
    generation,
    projectId,
  })
  const { createSocialImageResponse } = await import('@/lib/seo/social-image')

  return createSocialImageResponse(content)
}
