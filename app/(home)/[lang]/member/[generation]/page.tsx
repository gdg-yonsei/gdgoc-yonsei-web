/**
 * 기수별 멤버 페이지(`/{lang}/member/{기수}`).
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import JsonLd from '@/app/components/json-ld'
import EmptyState from '@/app/components/site/empty-state'
import MemberCard from '@/app/components/site/member-card'
import GenerationPageHeader from '@/app/components/site/generation-page-header'
import PageTransition from '@/app/components/site/page-transition'
import type { Locale } from '@/lib/i18n'
import {
  archiveCommonCopy,
  memberArchiveCopy,
} from '@/lib/contents/archive-copy'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { getMembersByGeneration } from '@/lib/server/queries/public/members'
import { getGenerationStaticParams } from '@/lib/server/queries/public/static-params'
import { createLocalizedMetadata, getLocalizedUrl } from '@/lib/seo/metadata'
import { countLabel, fillTemplate } from '@/lib/format/text'
import { breadcrumbList } from '@/lib/site/json-ld'
import { partHue } from '@/lib/site/labels'
import { toLocale } from '@/lib/i18n'
import { generationPath } from '@/lib/site/routes'

type Props = {
  params: Promise<{ lang: string; generation: string }>
}

/** 빌드 시 미리 렌더링할 경로 매개변수(공개 데이터에서 만든다). */
export async function generateStaticParams() {
  return getGenerationStaticParams()
}

/** 언어별 제목·설명·대체 언어 링크(hreflang) 메타데이터. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, generation } = await params
  const locale = toLocale(lang)

  if (!(await getMembersByGeneration(generation))) {
    notFound()
  }

  const copy = memberArchiveCopy[locale]
  return createLocalizedMetadata({
    locale,
    path: generationPath('member', generation),
    title: fillTemplate(copy.generationTitle, { generation }),
    description: fillTemplate(copy.generationDescription, { generation }),
  })
}

/** 페이지 본문. */
export default async function MemberGenerationPage({ params }: Props) {
  const { lang, generation } = await params
  const locale = toLocale(lang)
  const generations = await getGenerationSummaries()
  const current = generations.find(({ name }) => name === generation)

  if (!current) {
    notFound()
  }

  const copy = memberArchiveCopy[locale]
  const common = archiveCommonCopy[locale]

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
              url: getLocalizedUrl(
                locale,
                generationPath('member', generation)
              ),
            },
          ])}
        />
        <GenerationPageHeader
          lang={locale}
          section="member"
          current={current}
          generations={generations}
          tag={copy.tag}
          titleTemplate={copy.generationTitle}
          descriptionTemplate={copy.generationDescription}
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
  const data = await getMembersByGeneration(generation)
  const copy = memberArchiveCopy[lang]
  const parts = data?.parts ?? []

  if (parts.every((part) => part.usersToParts.length === 0)) {
    return (
      <div className="mt-8">
        <EmptyState title={copy.emptyTitle} body={copy.emptyBody} />
      </div>
    )
  }

  // 페이지의 첫 사진이 LCP 이미지일 가능성이 높으므로 우선 로드한다.
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
