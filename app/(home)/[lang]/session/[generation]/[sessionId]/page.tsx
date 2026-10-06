/** 비공개 세션이거나 URL의 기수가 실제 기수와 다르면 404다. */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import JsonLd from '@/app/components/json-ld'
import PageTransition from '@/app/components/site/page-transition'
import SessionDetailView from '@/app/components/site/session-detail/session-detail-view'
import type { Locale } from '@/lib/i18n'
import {
  archiveCommonCopy,
  sessionArchiveCopy,
} from '@/lib/contents/archive-copy'
import { getCachedSessionVisibilityBucket } from '@/lib/server/cache/session-visibility'
import {
  getSessionArchive,
  getSessionById,
} from '@/lib/server/queries/public/sessions'
import {
  createLocalizedMetadata,
  getAbsoluteUrl,
  getLocalizedUrl,
  getSiteUrl,
  summarizeForMetadata,
} from '@/lib/seo/metadata'
import { formatSessionShortDate } from '@/lib/format/datetime'
import {
  breadcrumbList,
  sessionEvent,
  sessionLearningResource,
} from '@/lib/site/json-ld'
import { categoryLabel } from '@/lib/site/labels'
import {
  adjacentSessions,
  relatedSessions,
  sessionLocation,
  sessionTitle,
} from '@/lib/site/session-log'
import SessionDetailLoading from './loading'
import { pickLocalized } from '@/lib/i18n'
import { getLocale } from '@/lib/i18n/server'
import { generationPath, sessionPath } from '@/lib/site/routes'

type Props = PageProps<'/[lang]/session/[generation]/[sessionId]'>

async function loadSession(sessionId: string, generation: string) {
  const visibilityBucket = await getCachedSessionVisibilityBucket()
  const [session, archive] = await Promise.all([
    getSessionById(sessionId, visibilityBucket),
    getSessionArchive(visibilityBucket),
  ])

  if (!session || session.part?.generation?.name !== generation) {
    return null
  }
  return { session, archive }
}

function fallbackDescription(
  locale: Locale,
  title: string,
  generation: string
) {
  return locale === 'ko'
    ? `GDGoC Yonsei ${generation} 기수의 ${title} 세션을 소개합니다.`
    : `Learn from ${title}, a GDGoC Yonsei ${generation} session.`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { generation, sessionId } = await params
  const locale = await getLocale()
  const loaded = await loadSession(sessionId, generation)

  if (!loaded) {
    notFound()
  }

  const { session } = loaded
  const title = sessionTitle(session, locale)

  return createLocalizedMetadata({
    locale,
    path: sessionPath(generation, sessionId),

    title: [
      title,
      categoryLabel(session.category, locale),
      ...(session.startAt
        ? [formatSessionShortDate(session.startAt, locale)]
        : []),
    ].join(' · '),
    description: summarizeForMetadata(
      pickLocalized(locale, {
        en: session.description,
        ko: session.descriptionKo,
      }),
      fallbackDescription(locale, title, generation)
    ),
    generatedSocialImage: true,
  })
}

export default async function SessionDetailPage({ params }: Props) {
  const { generation, sessionId } = await params

  return (
    <PageTransition>
      <Suspense fallback={<SessionDetailLoading />}>
        <SessionDetail generation={generation} sessionId={sessionId} />
      </Suspense>
    </PageTransition>
  )
}

async function SessionDetail({
  generation,
  sessionId,
}: {
  generation: string
  sessionId: string
}) {
  const locale = await getLocale()
  const loaded = await loadSession(sessionId, generation)

  if (!loaded) {
    notFound()
  }

  const { session, archive } = loaded
  const copy = sessionArchiveCopy[locale]
  const common = archiveCommonCopy[locale]
  const title = sessionTitle(session, locale)
  const description = pickLocalized(locale, {
    en: session.description,
    ko: session.descriptionKo,
  })
  const location = sessionLocation(session, locale)
  const url = getLocalizedUrl(locale, sessionPath(generation, sessionId))
  const summary = summarizeForMetadata(
    description,
    fallbackDescription(locale, title, generation)
  )
  const images = [session.mainImage, ...session.images].map(getAbsoluteUrl)
  const organizationId = `${getSiteUrl()}#organization`
  const entry = archive.find((item) => item.id === session.id)
  const { previous, next } = adjacentSessions(archive, session.id)

  return (
    <div className="site-page">
      <JsonLd
        id="session-structured-data"
        data={[
          session.startAt
            ? sessionEvent({
                url,
                name: title,
                description: summary,
                images,
                locale,
                startAt: session.startAt,
                endAt: session.endAt,
                location,
                organizer: {
                  id: organizationId,
                  name: 'GDGoC Yonsei',
                  url: getLocalizedUrl('en'),
                },
              })
            : sessionLearningResource({
                url,
                name: title,
                description: summary,
                images,
                locale,
                providerId: organizationId,
              }),
          breadcrumbList([
            { name: common.home, url: getLocalizedUrl(locale) },
            {
              name: common.sessions,
              url: getLocalizedUrl(locale, '/session'),
            },
            {
              name: generation,
              url: getLocalizedUrl(
                locale,
                generationPath('session', generation)
              ),
            },
            { name: title, url },
          ]),
        ]}
      />
      <SessionDetailView
        lang={locale}
        copy={copy}
        common={common}
        session={{
          id: session.id,
          title,
          category: session.category,
          description,
          startAt: session.startAt,
          endAt: session.endAt,
          location,
          partName: session.part?.name ?? null,
          generationName: generation,
          mainImage: session.mainImage,
          images: session.images,
        }}
        related={entry ? relatedSessions(archive, entry) : []}
        previous={previous}
        next={next}
      />
    </div>
  )
}
