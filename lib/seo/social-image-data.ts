/**
 * 소셜 미리보기 이미지에 들어갈 내용(제목, 기수, 분류, 날짜, 대표 이미지) 조회.
 */
import 'server-only'

import type { Locale } from '@/lib/i18n'
import { getCachedSessionVisibilityBucket } from '@/lib/server/cache/session-visibility'
import { getProjectById } from '@/lib/server/queries/public/projects'
import { getSessionById } from '@/lib/server/queries/public/sessions'
import {
  formatInstantDate,
  formatSessionShortDate,
} from '@/lib/format/datetime'
import { isPlaceholderImage } from '@/lib/site/images'
import { projectTitle } from '@/lib/site/project-showcase'
import { sessionTitle } from '@/lib/site/session-log'
import { categoryLabel, isSessionCategory } from '@/lib/site/labels'

/** 소셜 카드 내용. `version`은 원본 행이 바뀔 때마다 달라져 이미지 URL과 캐시 키에 쓰인다. */
export type SocialImageContent = {
  title: string
  generation: string
  category: string
  date: string
  representativeImage: string | null
  version: string
  locale: Locale
}

/** 수정 시각으로 짧은 버전 문자열을 만든다. */
function versionFor(date: Date): string {
  return date.getTime().toString(36)
}

/** 데이터를 찾지 못했을 때 쓰는 기본 카드 내용. */
export function createFallbackSocialImageContent(
  locale: Locale,
  kind: 'project' | 'session',
  generation = ''
): SocialImageContent {
  return {
    title:
      kind === 'session'
        ? locale === 'ko'
          ? 'GDGoC Yonsei 세션'
          : 'GDGoC Yonsei Session'
        : locale === 'ko'
          ? 'GDGoC Yonsei 프로젝트'
          : 'GDGoC Yonsei Project',
    generation,
    category:
      kind === 'session'
        ? locale === 'ko'
          ? '커뮤니티 행사'
          : 'Community Event'
        : locale === 'ko'
          ? '프로젝트'
          : 'Project',
    date: '',
    representativeImage: null,
    version: 'fallback',
    locale,
  }
}

/** 세션 소셜 카드 내용. 공개되지 않았거나 기수가 맞지 않으면 기본 카드. */
export async function getSessionSocialImageContent({
  locale,
  generation,
  sessionId,
}: {
  locale: Locale
  generation: string
  sessionId: string
}): Promise<SocialImageContent> {
  const fallback = createFallbackSocialImageContent(
    locale,
    'session',
    generation
  )
  const visibilityBucket = await getCachedSessionVisibilityBucket()
  const session = await getSessionById(sessionId, visibilityBucket)

  if (!session || session.part?.generation?.name !== generation) {
    return fallback
  }

  return {
    title: sessionTitle(session, locale),
    generation,
    category: isSessionCategory(session.category)
      ? categoryLabel(session.category, locale)
      : fallback.category,
    date: session.startAt
      ? formatSessionShortDate(session.startAt, locale)
      : '',
    representativeImage: isPlaceholderImage(session.mainImage)
      ? null
      : session.mainImage,
    version: versionFor(session.updatedAt),
    locale,
  }
}

/** 프로젝트 소셜 카드 내용. 없거나 기수가 맞지 않으면 기본 카드. */
export async function getProjectSocialImageContent({
  locale,
  generation,
  projectId,
}: {
  locale: Locale
  generation: string
  projectId: string
}): Promise<SocialImageContent> {
  const fallback = createFallbackSocialImageContent(
    locale,
    'project',
    generation
  )
  const project = await getProjectById(projectId)

  if (!project || project.generation.name !== generation) {
    return fallback
  }

  return {
    title: projectTitle(project, locale),
    generation,
    category: locale === 'ko' ? '프로젝트' : 'Project',
    date: formatInstantDate(project.updatedAt, locale),
    representativeImage: isPlaceholderImage(project.mainImage)
      ? null
      : project.mainImage,
    version: versionFor(project.updatedAt),
    locale,
  }
}

/** 소셜 이미지 대체 텍스트. */
export function getSocialImageAlt(content: SocialImageContent): string {
  return [content.title, content.generation, content.category]
    .filter(Boolean)
    .join(' · ')
}
