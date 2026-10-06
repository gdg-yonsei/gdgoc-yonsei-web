// 무거운 소셜 이미지 렌더러는 메타데이터 생성 대신 이미지 요청 시에만 불러온다.
import 'server-only'

import {
  getProjectSocialImageContent,
  getSessionSocialImageContent,
  getSocialImageAlt,
} from '@/lib/seo/social-image-data'
import { toLocale } from '@/lib/i18n'
import {
  SOCIAL_IMAGE_CONTENT_TYPE,
  SOCIAL_IMAGE_SIZE,
} from '@/lib/seo/social-image-config'

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

/** 이미지 메타데이터. ID에 버전을 넣어 내용이 바뀌면 이미지 URL도 바뀌게 한다. */
function imageMetadata(version: string, alt: string) {
  return [
    {
      id: version,
      alt,
      size: SOCIAL_IMAGE_SIZE,
      contentType: SOCIAL_IMAGE_CONTENT_TYPE,
    },
  ]
}

export async function generateSessionSocialImageMetadata(
  params: SessionSocialImageParams
) {
  const content = await getSessionSocialImageContent({
    locale: toLocale(params.lang),
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
    locale: toLocale(lang),
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
    locale: toLocale(params.lang),
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
    locale: toLocale(lang),
    generation,
    projectId,
  })
  const { createSocialImageResponse } = await import('@/lib/seo/social-image')

  return createSocialImageResponse(content)
}
