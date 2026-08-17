import 'server-only'

import type { Locale } from '@/i18n-config'
import { getCachedSessionVisibilityBucket } from '@/lib/server/cache/session-visibility'
import { getProjectById } from '@/lib/server/queries/public/projects'
import { getSessionById } from '@/lib/server/queries/public/sessions'

const DEFAULT_SOCIAL_IMAGE_PATHS = new Set([
  '/project-default.png',
  '/session-default.png',
])

const SESSION_CATEGORY_LABELS: Record<string, Record<Locale, string>> = {
  tech_talk: { en: 'Tech Talk', ko: '기술 세션' },
  part_session: { en: 'Part Session', ko: '파트 세션' },
  hackathon: { en: 'Hackathon', ko: '해커톤' },
  demo_day: { en: 'Demo Day', ko: '데모데이' },
  devrel: { en: 'Community Event', ko: '커뮤니티 행사' },
}

export type SocialImageContent = {
  title: string
  generation: string
  category: string
  date: string
  representativeImage: string | null
  version: string
  locale: Locale
}

function imagePath(value: string): string {
  try {
    return new URL(value, 'https://local.invalid').pathname
  } catch {
    return value.startsWith('/') ? value : `/${value}`
  }
}

function representativeImage(value: string): string | null {
  return DEFAULT_SOCIAL_IMAGE_PATHS.has(imagePath(value)) ? null : value
}

function formatSocialDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: locale === 'ko' ? 'numeric' : 'short',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(date)
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
    title: locale === 'ko' ? session.nameKo : session.name,
    generation,
    category:
      SESSION_CATEGORY_LABELS[session.category]?.[locale] ?? fallback.category,
    date: session.startAt ? formatSocialDate(session.startAt, locale) : '',
    representativeImage: representativeImage(session.mainImage),
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
    date: formatSocialDate(project.updatedAt, locale),
    representativeImage: representativeImage(project.mainImage),
    version: versionFor(project.updatedAt),
    locale,
  }
}

export function getSocialImageAlt(content: SocialImageContent): string {
  return [content.title, content.generation, content.category]
    .filter(Boolean)
    .join(' · ')
}
