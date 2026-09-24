import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import JsonLd from '@/app/components/json-ld'
import Breadcrumbs from '@/app/components/site/breadcrumbs'
import EmptyState from '@/app/components/site/empty-state'
import GenerationPager from '@/app/components/site/generation-pager'
import MemberCard from '@/app/components/site/member-card'
import PageHeader from '@/app/components/site/page-header'
import PageTransition from '@/app/components/site/page-transition'
import type { Locale } from '@/i18n-config'
import {
  archiveCommonCopy,
  memberArchiveCopy,
} from '@/lib/contents/archive-copy'
import languageParamChecker from '@/lib/language-param-checker'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { getMembersByGeneration } from '@/lib/server/queries/public/members'
import { getGenerationStaticParams } from '@/lib/server/queries/public/static-params'
import { createLocalizedMetadata, getLocalizedUrl } from '@/lib/seo/metadata'
import { countLabel, fillTemplate } from '@/lib/site/format'
import { generationNeighbors } from '@/lib/site/generations'
import { breadcrumbList } from '@/lib/site/json-ld'
import { partHue } from '@/lib/site/labels'

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, generation } = await params
  const locale = languageParamChecker(lang)

  if (!(await getMembersByGeneration(generation, locale))) {
    notFound()
  }

  const copy = memberArchiveCopy[locale]
  return createLocalizedMetadata({
    locale,
    path: `/member/${generation}`,
    title: fillTemplate(copy.generationTitle, { generation }),
    description: fillTemplate(copy.generationDescription, { generation }),
  })
}

export default async function MembersPage({ params }: Props) {
  const { lang, generation } = await params
  const locale = languageParamChecker(lang)
  const generations = await getGenerationSummaries(locale)
  const current = generations.find(({ name }) => name === generation)

  if (!current) {
    notFound()
  }

  const copy = memberArchiveCopy[locale]
  const common = archiveCommonCopy[locale]
  const { older, newer } = generationNeighbors(generations, generation)

  return (
    <PageTransition>
      <div className="site-page">
        <JsonLd
          id="member-generation-structured-data"
          data={breadcrumbList([
            { name: common.home, url: getLocalizedUrl(locale) },
            { name: common.members, url: getLocalizedUrl(locale, '/member') },
            {
              name: generation,
              url: getLocalizedUrl(locale, `/member/${generation}`),
            },
          ])}
        />
        <Breadcrumbs
          label={common.breadcrumb}
          items={[
            { label: common.home, href: `/${locale}` },
            { label: common.members, href: `/${locale}/member` },
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
                basePath="member"
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
        <Suspense fallback={<MemberDirectorySkeleton />}>
          <MemberDirectory generation={generation} lang={locale} />
        </Suspense>
      </div>
    </PageTransition>
  )
}

function MemberDirectorySkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading members"
      className="archive-skeleton"
    >
      <span className="skeleton-bar h-10 w-56 max-w-full" />
      {Array.from({ length: 6 }, (_, index) => (
        <span key={index} className="skeleton-bar h-20 w-full" />
      ))}
    </div>
  )
}

async function MemberDirectory({
  generation,
  lang,
}: {
  generation: string
  lang: Locale
}) {
  const data = await getMembersByGeneration(generation, lang)
  const copy = memberArchiveCopy[lang]
  const parts = data?.parts ?? []

  if (parts.every((part) => part.usersToParts.length === 0)) {
    return (
      <div className="mt-8">
        <EmptyState title={copy.emptyTitle} body={copy.emptyBody} />
      </div>
    )
  }

  // The first photo on the page is the likely LCP image.
  const firstPhoto = parts
    .flatMap((part) => part.usersToParts)
    .find(({ user }) => user.image)?.user.id

  return (
    <div className="member-directory">
      {parts.map((part) => (
        <section
          key={part.id}
          aria-labelledby={`part-${part.id}`}
          className="member-part"
          data-hue={partHue(part.name)}
        >
          <div className="member-part-head">
            <h2 id={`part-${part.id}`} className="member-part-title">
              {part.name}
            </h2>
            <span className="member-part-count">
              {countLabel(
                part.usersToParts.length,
                copy.countOne,
                copy.countMany
              )}
            </span>
          </div>
          {part.usersToParts.length === 0 ? (
            <p className="member-part-empty">{copy.partEmpty}</p>
          ) : (
            <ul className="member-grid">
              {part.usersToParts.map(({ user }) => (
                <MemberCard
                  key={user.id}
                  user={user}
                  lang={lang}
                  copy={copy}
                  preload={user.id === firstPhoto}
                />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}
