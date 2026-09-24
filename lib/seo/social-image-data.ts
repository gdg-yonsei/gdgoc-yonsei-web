import 'server-only'

import type { Locale } from '@/i18n-config'
import { getCachedSessionVisibilityBucket } from '@/lib/server/cache/session-visibility'
import { getProjectById } from '@/lib/server/queries/public/projects'
import { getSessionById } from '@/lib/server/queries/public/sessions'
import { formatInstantDate, formatSessionShortDate } from '@/lib/site/datetime'
import { isPlaceholderImage } from '@/lib/site/images'
import { categoryLabel, isSessionCategory } from '@/lib/site/labels'

export type SocialImageContent = {
  title: string
  generation: string
  category: string
  date: string
  representativeImage: string | null
  version: string
  locale: Locale
}

function versionFor(date: Date): string {
  return date.getTime().toString(36)
}

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
  const session = await getSessionById(sessionId, locale, visibilityBucket)

  if (!session || session.part?.generation?.name !== generation) {
    return fallback
  }

  return {
    title: locale === 'ko' ? session.nameKo || session.name : session.name,
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
  const project = await getProjectById(projectId, locale)

  if (!project || project.generation.name !== generation) {
    return fallback
  }

  return {
    title: locale === 'ko' ? project.nameKo || project.name : project.name,
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

export function getSocialImageAlt(content: SocialImageContent): string {
  return [content.title, content.generation, content.category]
    .filter(Boolean)
    .join(' · ')
}
