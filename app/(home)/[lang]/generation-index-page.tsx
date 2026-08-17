import Link from 'next/link'
import PageTitle from '@/app/components/page-title'
import JsonLd from '@/app/components/json-ld'
import type { Locale } from '@/i18n-config'
import { getLocalizedUrl, getSiteUrl } from '@/lib/seo/metadata'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

type GenerationSummary = {
  id: number
  name: string
  startDate: string
  endDate: string | null
}

type GenerationIndexPageProps = {
  basePath: 'member' | 'project' | 'session'
  description: string
  emptyLabel: string
  generations: GenerationSummary[]
  lang: Locale
  title: string
}

export default function GenerationIndexPage({
  basePath,
  description,
  emptyLabel,
  generations,
  lang,
  title,
}: GenerationIndexPageProps) {
  const sortedGenerations = [...generations].reverse()
  const canonical = getLocalizedUrl(lang, `/${basePath}`)
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${canonical}#collection-page`,
      url: canonical,
      name: title,
      description,
      inLanguage: lang,
      isPartOf: { '@id': `${getSiteUrl()}#website` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonical}#generation-list`,
      name: title,
      itemListElement: sortedGenerations.map((generation, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: generation.name,
        url: getLocalizedUrl(lang, `/${basePath}/${generation.name}`),
      })),
    },
  ]

  return (
    <div className="min-h-screen w-full pt-20">
      <JsonLd id={`${basePath}-index-structured-data`} data={structuredData} />
      <PageTitle>{title}</PageTitle>
      <section className="mx-auto w-full max-w-4xl px-4 pb-20">
        <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <p className="max-w-3xl text-base leading-7 text-neutral-700 sm:text-lg sm:leading-8">
            {description}
          </p>
          <span className="w-fit shrink-0 rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700">
            {lang === 'ko'
              ? `${sortedGenerations.length}개 기수`
              : `${sortedGenerations.length} generation${sortedGenerations.length === 1 ? '' : 's'}`}
          </span>
        </div>
        {sortedGenerations.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">
            {emptyLabel}
          </p>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {sortedGenerations.map((generation) => (
              <li key={generation.id}>
                <Link
                  href={`/${lang}/${basePath}/${generation.name}`}
                  prefetch={true}
                  className="interactive-card focus-ring group flex h-full min-h-36 flex-col justify-between gap-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm active:scale-[0.98] sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="bg-logo-blue mb-3 block size-2.5 rounded-full" />
                      <h2 className="text-2xl leading-tight font-semibold break-words">
                        {generation.name}
                      </h2>
                    </div>
                    <ArrowRightIcon
                      aria-hidden="true"
                      className="mt-1 size-5 shrink-0 text-neutral-500 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-1 motion-reduce:transform-none"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
                    <time dateTime={generation.startDate}>
                      {generation.startDate}
                    </time>
                    <span aria-hidden="true">–</span>
                    {generation.endDate ? (
                      <time dateTime={generation.endDate}>
                        {generation.endDate}
                      </time>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2.5 py-1 font-medium text-green-800">
                        {lang === 'ko' ? '현재' : 'Present'}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
