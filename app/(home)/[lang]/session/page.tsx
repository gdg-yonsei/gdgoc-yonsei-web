/**
 * 세션 허브(`/{lang}/session`): 기수 띠, 검색·필터, 세션 로그.
 */
import type { Metadata } from 'next'
import ArchiveHubShell from '@/app/components/site/archive-hub-shell'
import {
  ArchiveListSkeleton,
  SkeletonBars,
} from '@/app/components/site/skeletons'
import JsonLd from '@/app/components/json-ld'
import EmptyState from '@/app/components/site/empty-state'
import FilterBar from '@/app/components/site/filter-bar'
import GenerationStrip from '@/app/components/site/generation-strip'
import SessionLog from '@/app/components/site/session-log/session-log'
import {
  archiveCommonCopy,
  sessionArchiveCopy,
  sessionFilterCopy,
} from '@/lib/contents/archive-copy'
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
import { localeStaticParams } from '@/lib/i18n'
import { getLocale } from '@/lib/i18n/server'
import { sessionPath } from '@/lib/site/routes'

const en = sessionArchiveCopy.en
const ko = sessionArchiveCopy.ko

/** 빌드 시 미리 렌더링할 경로 매개변수. */
export function generateStaticParams() {
  return localeStaticParams()
}

/** 언어별 제목·설명·대체 언어 링크(hreflang) 메타데이터. */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const copy = sessionArchiveCopy[locale]

  return createLocalizedMetadata({
    locale,
    path: '/session',
    title: copy.hubTitle,
    description: copy.hubDescription,
  })
}

/** 페이지 본문. */
export default function SessionHubPage() {
  return (
    <ArchiveHubShell
      section="sessions"
      testId="session-log-shell"
      tag={en.tag}
      title={{ en: en.hubTitle, ko: ko.hubTitle }}
      description={{ en: en.hubDescription, ko: ko.hubDescription }}
      fallback={
        <ArchiveListSkeleton label="Loading sessions">
          <SkeletonBars count={4} className="h-20 w-full" />
        </ArchiveListSkeleton>
      }
    >
      <SessionHubContent />
    </ArchiveHubShell>
  )
}

async function SessionHubContent() {
  const lang = await getLocale()
  const copy = sessionArchiveCopy[lang]
  const common = archiveCommonCopy[lang]
  const visibilityBucket = await getCachedSessionVisibilityBucket()
  const [archive, generations] = await Promise.all([
    getSessionArchive(visibilityBucket),
    getGenerationSummaries(),
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
                sessionPath(session.generationName, session.id)
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
