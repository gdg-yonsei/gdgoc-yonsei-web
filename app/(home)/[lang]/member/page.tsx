import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import JsonLd from '@/app/components/json-ld'
import LocalizedText from '@/app/components/localized-text'
import EmptyState from '@/app/components/site/empty-state'
import HubBreadcrumbs from '@/app/components/site/hub-breadcrumbs'
import PageHeader from '@/app/components/site/page-header'
import PageTransition from '@/app/components/site/page-transition'
import {
  archiveCommonCopy,
  memberArchiveCopy,
} from '@/lib/contents/archive-copy'
import languageParamChecker from '@/lib/language-param-checker'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import {
  createLocalizedMetadata,
  getLocalizedUrl,
  getSiteUrl,
} from '@/lib/seo/metadata'
import { fillTemplate } from '@/lib/site/format'
import { breadcrumbList, collectionPage } from '@/lib/site/json-ld'

type Props = { params: Promise<{ lang: string }> }

const en = memberArchiveCopy.en
const ko = memberArchiveCopy.ko

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = languageParamChecker((await params).lang)
  const copy = memberArchiveCopy[locale]

  return createLocalizedMetadata({
    locale,
    path: '/member',
    title: copy.hubTitle,
    description: copy.hubDescription,
  })
}

/*
 * The shell never reads params, so every link here shares one instant App
 * Shell; LocalizedText picks the language with CSS.
 */
export default function MemberIndex({ params }: Props) {
  return (
    <PageTransition>
      <div className="site-page" data-testid="member-directory-shell">
        <Suspense
          fallback={
            <div aria-hidden="true" className="site-breadcrumbs-skeleton" />
          }
        >
          <HubBreadcrumbs params={params} section="members" />
        </Suspense>
        <PageHeader
          tag={en.tag}
          title={<LocalizedText en={en.hubTitle} ko={ko.hubTitle} />}
          description={
            <LocalizedText en={en.hubDescription} ko={ko.hubDescription} />
          }
        />
        <Suspense fallback={<MemberHubSkeleton />}>
          <MemberHubContent params={params} />
        </Suspense>
      </div>
    </PageTransition>
  )
}

function MemberHubSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading generations"
      className="archive-skeleton"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <span key={index} className="skeleton-bar h-28 w-full rounded-3xl" />
      ))}
    </div>
  )
}

async function MemberHubContent({ params }: Props) {
  const lang = languageParamChecker((await params).lang)
  const copy = memberArchiveCopy[lang]
  const common = archiveCommonCopy[lang]
  const generations = [...(await getGenerationSummaries(lang))].sort((a, b) =>
    b.startDate.localeCompare(a.startDate)
  )
  const url = getLocalizedUrl(lang, '/member')

  if (generations.length === 0) {
    return <EmptyState title={copy.emptyTitle} body={copy.emptyBody} />
  }

  return (
    <>
      <JsonLd
        id="member-hub-structured-data"
        data={[
          ...collectionPage({
            url,
            name: copy.hubTitle,
            description: copy.hubDescription,
            locale: lang,
            websiteId: `${getSiteUrl()}#website`,
            items: generations.map((generation) => ({
              name: fillTemplate(copy.generationTitle, {
                generation: generation.name,
              }),
              url: getLocalizedUrl(lang, `/member/${generation.name}`),
            })),
          }),
          breadcrumbList([
            { name: common.home, url: getLocalizedUrl(lang) },
            { name: common.members, url },
          ]),
        ]}
      />
      <ul className="member-generations">
        {generations.map((generation) => (
          <li key={generation.id}>
            <Link
              href={`/${lang}/member/${generation.name}`}
              prefetch={true}
              transitionTypes={['nav-forward']}
              className="member-generation"
            >
              <span className="member-generation-name">{generation.name}</span>
              <span className="member-generation-dates">
                <time dateTime={generation.startDate}>
                  {generation.startDate}
                </time>
                <span aria-hidden="true">–</span>
                {generation.endDate ? (
                  <time dateTime={generation.endDate}>
                    {generation.endDate}
                  </time>
                ) : (
                  <span className="member-generation-now">{copy.present}</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
