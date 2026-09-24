import type { Metadata } from 'next'
import { Suspense } from 'react'
import JsonLd from '@/app/components/json-ld'
import LocalizedText from '@/app/components/localized-text'
import EmptyState from '@/app/components/site/empty-state'
import FilterBar from '@/app/components/site/filter-bar'
import GenerationStrip from '@/app/components/site/generation-strip'
import HubBreadcrumbs from '@/app/components/site/hub-breadcrumbs'
import PageHeader from '@/app/components/site/page-header'
import PageTransition from '@/app/components/site/page-transition'
import RevealSuspense from '@/app/components/site/reveal-suspense'
import SessionLog from '@/app/components/site/session-log/session-log'
import {
  archiveCommonCopy,
  sessionArchiveCopy,
  sessionFilterCopy,
} from '@/lib/contents/archive-copy'
import languageParamChecker from '@/lib/language-param-checker'
import { getCachedSessionVisibilityBucket } from '@/lib/server/cache/session-visibility'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { getSessionArchive } from '@/lib/server/queries/public/sessions'
import {
  createLocalizedMetadata,
  getLocalizedUrl,
  getSiteUrl,
} from '@/lib/seo/metadata'
import { countByGeneration, generationStrip } from '@/lib/site/generations'
import { breadcrumbList, collectionPage } from '@/lib/site/json-ld'
import {
  groupSessionLog,
  sessionFacets,
  sessionTitle,
} from '@/lib/site/session-log'

type Props = { params: Promise<{ lang: string }> }

const en = sessionArchiveCopy.en
const ko = sessionArchiveCopy.ko

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = languageParamChecker((await params).lang)
  const copy = sessionArchiveCopy[locale]

  return createLocalizedMetadata({
    locale,
    path: '/session',
    title: copy.hubTitle,
    description: copy.hubDescription,
  })
}

/*
 * The shell (header, H1, description) never reads params, so every link to
 * this route shares one instant App Shell; LocalizedText picks the language
 * with CSS. Everything URL- or data-dependent streams in below.
 */
export default function SessionHubPage({ params }: Props) {
  return (
    <PageTransition>
      <div className="site-page" data-testid="session-log-shell">
        <Suspense
          fallback={
            <div aria-hidden="true" className="site-breadcrumbs-skeleton" />
          }
        >
          <HubBreadcrumbs params={params} section="sessions" />
        </Suspense>
        <PageHeader
          tag={en.tag}
          title={<LocalizedText en={en.hubTitle} ko={ko.hubTitle} />}
          description={
            <LocalizedText en={en.hubDescription} ko={ko.hubDescription} />
          }
        />
        <RevealSuspense fallback={<SessionHubFallback />}>
          <SessionHubContent params={params} />
        </RevealSuspense>
      </div>
    </PageTransition>
  )
}

function SessionHubFallback() {
  return (
    <div
      role="status"
      aria-label="Loading sessions"
      className="archive-skeleton"
    >
      <span className="skeleton-bar h-10 w-72 max-w-full" />
      <span className="skeleton-bar h-36 w-full rounded-3xl" />
      {Array.from({ length: 4 }, (_, index) => (
        <span key={index} className="skeleton-bar h-20 w-full" />
      ))}
    </div>
  )
}

async function SessionHubContent({ params }: Props) {
  const lang = languageParamChecker((await params).lang)
  const copy = sessionArchiveCopy[lang]
  const common = archiveCommonCopy[lang]
  const visibilityBucket = await getCachedSessionVisibilityBucket()
  const [archive, generations] = await Promise.all([
    getSessionArchive(visibilityBucket),
    getGenerationSummaries(lang),
  ])
  const facets = sessionFacets(archive, lang)
  const url = getLocalizedUrl(lang, '/session')

  return (
    <>
      <JsonLd
        id="session-log-structured-data"
        data={[
          ...collectionPage({
            url,
            name: copy.hubTitle,
            description: copy.hubDescription,
            locale: lang,
            websiteId: `${getSiteUrl()}#website`,
            items: archive.map((session) => ({
              name: sessionTitle(session, lang),
              url: getLocalizedUrl(
                lang,
                `/session/${session.generationName}/${session.id}`
              ),
            })),
          }),
          breadcrumbList([
            { name: common.home, url: getLocalizedUrl(lang) },
            { name: common.sessions, url },
          ]),
        ]}
      />
      <GenerationStrip
        basePath="session"
        lang={lang}
        label={common.generations}
        emptyLabel={common.noRecords}
        generations={generationStrip(generations, countByGeneration(archive))}
      />
      {archive.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={copy.emptyTitle} body={copy.emptyBody} />
        </div>
      ) : (
        <>
          <FilterBar
            scope="session-log"
            total={archive.length}
            copy={sessionFilterCopy(lang)}
            facets={[
              {
                key: 'category',
                legend: copy.facetCategory,
                options: facets.categories,
              },
              { key: 'part', legend: copy.facetPart, options: facets.parts },
              {
                key: 'generation',
                legend: copy.facetGeneration,
                options: facets.generations,
              },
            ]}
          />
          <SessionLog
            id="session-log"
            lang={lang}
            copy={copy}
            showGenerations
            generations={groupSessionLog(archive)}
          />
        </>
      )}
    </>
  )
}
