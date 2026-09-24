import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import JsonLd from '@/app/components/json-ld'
import Breadcrumbs from '@/app/components/site/breadcrumbs'
import EmptyState from '@/app/components/site/empty-state'
import FilterBar from '@/app/components/site/filter-bar'
import GenerationPager from '@/app/components/site/generation-pager'
import PageHeader from '@/app/components/site/page-header'
import PageTransition from '@/app/components/site/page-transition'
import RevealSuspense from '@/app/components/site/reveal-suspense'
import SessionLog from '@/app/components/site/session-log/session-log'
import type { Locale } from '@/i18n-config'
import {
  archiveCommonCopy,
  sessionArchiveCopy,
  sessionFilterCopy,
} from '@/lib/contents/archive-copy'
import languageParamChecker from '@/lib/language-param-checker'
import { getCachedSessionVisibilityBucket } from '@/lib/server/cache/session-visibility'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { getSessionArchive } from '@/lib/server/queries/public/sessions'
import { getGenerationStaticParams } from '@/lib/server/queries/public/static-params'
import {
  createLocalizedMetadata,
  getLocalizedUrl,
  getSiteUrl,
} from '@/lib/seo/metadata'
import { fillTemplate } from '@/lib/site/format'
import { generationNeighbors } from '@/lib/site/generations'
import { breadcrumbList, collectionPage } from '@/lib/site/json-ld'
import {
  groupSessionLog,
  sessionFacets,
  sessionTitle,
} from '@/lib/site/session-log'

type Props = {
  params: Promise<{ lang: string; generation: string }>
}

export async function generateStaticParams({
  params,
}: {
  params: { lang: string }
}) {
  return getGenerationStaticParams(languageParamChecker(params.lang))
}

async function generationSessions(generation: string) {
  const visibilityBucket = await getCachedSessionVisibilityBucket()
  const archive = await getSessionArchive(visibilityBucket)
  return archive.filter((session) => session.generationName === generation)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, generation } = await params
  const locale = languageParamChecker(lang)
  const [generations, sessions] = await Promise.all([
    getGenerationSummaries(locale),
    generationSessions(generation),
  ])

  if (!generations.some(({ name }) => name === generation)) {
    notFound()
  }

  const copy = sessionArchiveCopy[locale]
  return createLocalizedMetadata({
    locale,
    path: `/session/${generation}`,
    title: fillTemplate(copy.generationTitle, { generation }),
    description: fillTemplate(copy.generationDescription, { generation }),
    // Reachable, linked from nowhere, and not worth an index slot.
    noindex: sessions.length === 0,
  })
}

export default async function SessionGenerationPage({ params }: Props) {
  const { lang, generation } = await params
  const locale = languageParamChecker(lang)
  const generations = await getGenerationSummaries(locale)
  const current = generations.find(({ name }) => name === generation)

  if (!current) {
    notFound()
  }

  const copy = sessionArchiveCopy[locale]
  const common = archiveCommonCopy[locale]
  const { older, newer } = generationNeighbors(generations, generation)

  return (
    <PageTransition>
      <div className="site-page">
        <Breadcrumbs
          label={common.breadcrumb}
          items={[
            { label: common.home, href: `/${locale}` },
            { label: common.sessions, href: `/${locale}/session` },
            { label: generation },
          ]}
        />
        <PageHeader
          tag={copy.tag}
          title={fillTemplate(copy.generationTitle, { generation })}
          description={fillTemplate(copy.generationDescription, { generation })}
          meta={
            <>
              <span>
                {current.startDate}
                {current.endDate ? ` – ${current.endDate}` : ''}
              </span>
              <GenerationPager
                basePath="session"
                lang={locale}
                older={older}
                newer={newer}
                label={common.generations}
                olderLabel={common.olderGeneration}
                newerLabel={common.newerGeneration}
              />
            </>
          }
        />
        <RevealSuspense fallback={<GenerationLogFallback />}>
          <SessionGenerationContent generation={generation} lang={locale} />
        </RevealSuspense>
      </div>
    </PageTransition>
  )
}

function GenerationLogFallback() {
  return (
    <div
      role="status"
      aria-label="Loading sessions"
      className="archive-skeleton"
    >
      <span className="skeleton-bar h-28 w-full rounded-3xl" />
      {Array.from({ length: 4 }, (_, index) => (
        <span key={index} className="skeleton-bar h-20 w-full" />
      ))}
    </div>
  )
}

async function SessionGenerationContent({
  generation,
  lang,
}: {
  generation: string
  lang: Locale
}) {
  const copy = sessionArchiveCopy[lang]
  const common = archiveCommonCopy[lang]
  const sessions = await generationSessions(generation)

  if (sessions.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState title={copy.emptyTitle} body={copy.emptyBody} />
      </div>
    )
  }

  const facets = sessionFacets(sessions, lang)
  const url = getLocalizedUrl(lang, `/session/${generation}`)

  return (
    <>
      <JsonLd
        id="session-generation-structured-data"
        data={[
          ...collectionPage({
            url,
            name: fillTemplate(copy.generationTitle, { generation }),
            description: fillTemplate(copy.generationDescription, {
              generation,
            }),
            locale: lang,
            websiteId: `${getSiteUrl()}#website`,
            items: sessions.map((session) => ({
              name: sessionTitle(session, lang),
              url: getLocalizedUrl(
                lang,
                `/session/${generation}/${session.id}`
              ),
            })),
          }),
          breadcrumbList([
            { name: common.home, url: getLocalizedUrl(lang) },
            { name: common.sessions, url: getLocalizedUrl(lang, '/session') },
            { name: generation, url },
          ]),
        ]}
      />
      <FilterBar
        scope="session-log"
        total={sessions.length}
        copy={sessionFilterCopy(lang)}
        facets={[
          {
            key: 'category',
            legend: copy.facetCategory,
            options: facets.categories,
          },
          { key: 'part', legend: copy.facetPart, options: facets.parts },
        ]}
      />
      <SessionLog
        id="session-log"
        lang={lang}
        copy={copy}
        showGenerations={false}
        generations={groupSessionLog(sessions)}
      />
    </>
  )
}
