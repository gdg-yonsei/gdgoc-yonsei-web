import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import JsonLd from '@/app/components/json-ld'
import PageTransition from '@/app/components/site/page-transition'
import RevealSuspense from '@/app/components/site/reveal-suspense'
import SessionDetailView from '@/app/components/site/session-detail/session-detail-view'
import type { Locale } from '@/i18n-config'
import {
  archiveCommonCopy,
  sessionArchiveCopy,
} from '@/lib/contents/archive-copy'
import languageParamChecker from '@/lib/language-param-checker'
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
import { formatSessionShortDate } from '@/lib/site/datetime'
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

type Props = {
  params: Promise<{ lang: string; generation: string; sessionId: string }>
}

async function loadSession(
  sessionId: string,
  generation: string,
  locale: Locale
) {
  const visibilityBucket = await getCachedSessionVisibilityBucket()
  const [session, archive] = await Promise.all([
    getSessionById(sessionId, locale, visibilityBucket),
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
  const { lang, generation, sessionId } = await params
  const locale = languageParamChecker(lang)
  const loaded = await loadSession(sessionId, generation, locale)

  if (!loaded) {
    notFound()
  }

  const { session } = loaded
  const title = sessionTitle(session, locale)

  return createLocalizedMetadata({
    locale,
    path: `/session/${generation}/${sessionId}`,
    // "25-26 Sixth T19 · Tech Talk · Nov 4, 2025"
    title: [
      title,
      categoryLabel(session.category, locale),
      ...(session.startAt
        ? [formatSessionShortDate(session.startAt, locale)]
        : []),
    ].join(' · '),
    description: summarizeForMetadata(
      locale === 'ko' ? session.descriptionKo : session.description,
      fallbackDescription(locale, title, generation)
    ),
    generatedSocialImage: true,
  })
}

export default async function SessionDetailPage({ params }: Props) {
  const resolved = await params

  return (
    <PageTransition>
      <RevealSuspense fallback={<SessionDetailLoading />}>
        <SessionDetail {...resolved} />
      </RevealSuspense>
    </PageTransition>
  )
}

async function SessionDetail({
  lang,
  generation,
  sessionId,
}: {
  lang: string
  generation: string
  sessionId: string
}) {
  const locale = languageParamChecker(lang)
  const loaded = await loadSession(sessionId, generation, locale)

  if (!loaded) {
    notFound()
  }

  const { session, archive } = loaded
  const copy = sessionArchiveCopy[locale]
  const common = archiveCommonCopy[locale]
  const title = sessionTitle(session, locale)
  const description =
    locale === 'ko' ? session.descriptionKo : session.description
  const location = sessionLocation(session, locale)
  const url = getLocalizedUrl(locale, `/session/${generation}/${sessionId}`)
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
              url: getLocalizedUrl(locale, `/session/${generation}`),
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
