import type { Metadata } from 'next'
import Link from 'next/link'
import ArchiveHubShell from '@/app/components/site/archive-hub-shell'
import {
  ArchiveListSkeleton,
  SkeletonBars,
} from '@/app/components/site/skeletons'
import JsonLd from '@/app/components/json-ld'
import EmptyState from '@/app/components/site/empty-state'
import {
  archiveCommonCopy,
  memberArchiveCopy,
} from '@/lib/contents/archive-copy'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import {
  createLocalizedMetadata,
  getLocalizedUrl,
  getSiteUrl,
} from '@/lib/seo/metadata'
import { fillTemplate } from '@/lib/format/text'
import { breadcrumbList, collectionPage } from '@/lib/site/json-ld'
import { localeStaticParams } from '@/lib/i18n'
import { getLocale } from '@/lib/i18n/server'
import { generationPath, localeHref } from '@/lib/site/routes'

const en = memberArchiveCopy.en
const ko = memberArchiveCopy.ko

export function generateStaticParams() {
  return localeStaticParams()
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const copy = memberArchiveCopy[locale]

  return createLocalizedMetadata({
    locale,
    path: '/member',
    title: copy.hubTitle,
    description: copy.hubDescription,
  })
}

export default function MemberIndex() {
  return (
    <ArchiveHubShell
      section="members"
      testId="member-directory-shell"
      tag={en.tag}
      title={{ en: en.hubTitle, ko: ko.hubTitle }}
      description={{ en: en.hubDescription, ko: ko.hubDescription }}
      fallback={
        <ArchiveListSkeleton label="Loading generations" showFilters={false}>
          <SkeletonBars count={4} className="h-28 w-full rounded-3xl" />
        </ArchiveListSkeleton>
      }
    >
      <MemberHubContent />
    </ArchiveHubShell>
  )
}

async function MemberHubContent() {
  const lang = await getLocale()
  const copy = memberArchiveCopy[lang]
  const common = archiveCommonCopy[lang]
  const generations = [...(await getGenerationSummaries())].sort((a, b) =>
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
              url: getLocalizedUrl(
                lang,
                generationPath('member', generation.name)
              ),
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
              href={localeHref(lang, generationPath('member', generation.name))}
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
