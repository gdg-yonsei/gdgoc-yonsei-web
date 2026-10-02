/**
 * 세션·프로젝트 상세의 opengraph-image / twitter-image 라우트 구현.
 *
 * 라우트 파일은 이 함수들을 그대로 내보낸다. 무거운 렌더러(`social-image.tsx`)는 이미지 요청이
 * 올 때만 동적으로 불러온다.
 */
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

/** 세션 상세 라우트 파라미터. */
export type SessionSocialImageParams = {
  lang: string
  generation: string
  sessionId: string
}

/** 프로젝트 상세 라우트 파라미터. */
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

/** 세션 소셜 이미지 메타데이터(`generateImageMetadata`). */
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

/** 세션 소셜 이미지를 그린다. */
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

/** 프로젝트 소셜 이미지 메타데이터. */
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

/** 프로젝트 소셜 이미지를 그린다. */
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
