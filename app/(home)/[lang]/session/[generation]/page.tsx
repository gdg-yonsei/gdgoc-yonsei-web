import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import JsonLd from '@/app/components/json-ld'
import EmptyState from '@/app/components/site/empty-state'
import FilterBar from '@/app/components/site/filter-bar'
import GenerationPageHeader from '@/app/components/site/generation-page-header'
import PageTransition from '@/app/components/site/page-transition'
import SessionLog from '@/app/components/site/session-log/session-log'
import type { Locale } from '@/lib/i18n'
import {
  archiveCommonCopy,
  sessionArchiveCopy,
  sessionFilterCopy,
} from '@/lib/contents/archive-copy'
import { getCachedSessionVisibilityBucket } from '@/lib/server/cache/session-visibility'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { getSessionArchive } from '@/lib/server/queries/public/sessions'
import { getGenerationStaticParams } from '@/lib/server/queries/public/static-params'
import {
  createLocalizedMetadata,
  getLocalizedUrl,
  getSiteUrl,
} from '@/lib/seo/metadata'
import { fillTemplate } from '@/lib/format/text'
import { breadcrumbList, collectionPage } from '@/lib/site/json-ld'
import {
  groupSessionLog,
  sessionFacets,
  sessionTitle,
} from '@/lib/site/session-log'
import { getLocale } from '@/lib/i18n/server'
import { generationPath, sessionPath } from '@/lib/site/routes'

type Props = PageProps<'/[lang]/session/[generation]'>

export async function generateStaticParams() {
  return getGenerationStaticParams()
}

async function generationSessions(generation: string) {
  const visibilityBucket = await getCachedSessionVisibilityBucket()
  const archive = await getSessionArchive(visibilityBucket)
  return archive.filter((session) => session.generationName === generation)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { generation } = await params
  const locale = await getLocale()
  const [generations, sessions] = await Promise.all([
    getGenerationSummaries(),
    generationSessions(generation),
  ])

  if (!generations.some(({ name }) => name === generation)) {
    notFound()
  }

  const copy = sessionArchiveCopy[locale]
  return createLocalizedMetadata({
    locale,
    path: generationPath('session', generation),
    title: fillTemplate(copy.generationTitle, { generation }),
    description: fillTemplate(copy.generationDescription, { generation }),
    // 기록이 없는 기수 페이지는 접근은 되지만 어디서도 링크하지 않으므로(기수 띠에서 흐리게 표시) 색인할 가치가 없다.
    noindex: sessions.length === 0,
  })
}

export default async function SessionGenerationPage({ params }: Props) {
  const { generation } = await params
  const locale = await getLocale()
  const generations = await getGenerationSummaries()
  const current = generations.find(({ name }) => name === generation)

  if (!current) {
    notFound()
  }

  const copy = sessionArchiveCopy[locale]

  return (
    <PageTransition>
      <div className="site-page">
        <GenerationPageHeader
          lang={locale}
          section="session"
          current={current}
          generations={generations}
          tag={copy.tag}
          titleTemplate={copy.generationTitle}
          descriptionTemplate={copy.generationDescription}
        />
        <Suspense fallback={<GenerationLogFallback />}>
          <SessionGenerationContent generation={generation} lang={locale} />
        </Suspense>
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
  const url = getLocalizedUrl(lang, generationPath('session', generation))

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
              url: getLocalizedUrl(lang, sessionPath(generation, session.id)),
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
