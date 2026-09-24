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
import ProjectGrid from '@/app/components/site/project-grid/project-grid'
import type { Locale } from '@/i18n-config'
import {
  archiveCommonCopy,
  projectArchiveCopy,
  projectFilterCopy,
} from '@/lib/contents/archive-copy'
import languageParamChecker from '@/lib/language-param-checker'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { getProjectShowcase } from '@/lib/server/queries/public/projects'
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
  projectFacets,
  projectTitle,
  sortShowcase,
} from '@/lib/site/project-showcase'

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

async function generationProjects(generation: string) {
  return sortShowcase(await getProjectShowcase()).filter(
    (project) => project.generationName === generation
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, generation } = await params
  const locale = languageParamChecker(lang)
  const [generations, projects] = await Promise.all([
    getGenerationSummaries(locale),
    generationProjects(generation),
  ])

  if (!generations.some(({ name }) => name === generation)) {
    notFound()
  }

  const copy = projectArchiveCopy[locale]
  return createLocalizedMetadata({
    locale,
    path: `/project/${generation}`,
    title: fillTemplate(copy.generationTitle, { generation }),
    description: fillTemplate(copy.generationDescription, { generation }),
    noindex: projects.length === 0,
  })
}

export default async function ProjectGenerationPage({ params }: Props) {
  const { lang, generation } = await params
  const locale = languageParamChecker(lang)
  const generations = await getGenerationSummaries(locale)
  const current = generations.find(({ name }) => name === generation)

  if (!current) {
    notFound()
  }

  const copy = projectArchiveCopy[locale]
  const common = archiveCommonCopy[locale]
  const { older, newer } = generationNeighbors(generations, generation)

  return (
    <PageTransition>
      <div className="site-page">
        <Breadcrumbs
          label={common.breadcrumb}
          items={[
            { label: common.home, href: `/${locale}` },
            { label: common.projects, href: `/${locale}/project` },
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
                basePath="project"
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
        <RevealSuspense fallback={<GenerationGridFallback />}>
          <ProjectGenerationContent generation={generation} lang={locale} />
        </RevealSuspense>
      </div>
    </PageTransition>
  )
}

function GenerationGridFallback() {
  return (
    <div
      role="status"
      aria-label="Loading projects"
      className="archive-skeleton"
    >
      <span className="skeleton-bar h-28 w-full rounded-3xl" />
      <div className="release-grid">
        {Array.from({ length: 3 }, (_, index) => (
          <span key={index} className="skeleton-bar aspect-[4/5] rounded-3xl" />
        ))}
      </div>
    </div>
  )
}

async function ProjectGenerationContent({
  generation,
  lang,
}: {
  generation: string
  lang: Locale
}) {
  const copy = projectArchiveCopy[lang]
  const common = archiveCommonCopy[lang]
  const projects = await generationProjects(generation)

  if (projects.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState title={copy.emptyTitle} body={copy.emptyBody} />
      </div>
    )
  }

  const facets = projectFacets(projects)
  const url = getLocalizedUrl(lang, `/project/${generation}`)

  return (
    <>
      <JsonLd
        id="project-generation-structured-data"
        data={[
          ...collectionPage({
            url,
            name: fillTemplate(copy.generationTitle, { generation }),
            description: fillTemplate(copy.generationDescription, {
              generation,
            }),
            locale: lang,
            websiteId: `${getSiteUrl()}#website`,
            items: projects.map((project) => ({
              name: projectTitle(project, lang),
              url: getLocalizedUrl(
                lang,
                `/project/${generation}/${project.id}`
              ),
            })),
          }),
          breadcrumbList([
            { name: common.home, url: getLocalizedUrl(lang) },
            { name: common.projects, url: getLocalizedUrl(lang, '/project') },
            { name: generation, url },
          ]),
        ]}
      />
      <FilterBar
        scope="project-grid"
        total={projects.length}
        copy={projectFilterCopy(lang)}
        facets={[
          { key: 'tag', legend: copy.facetStack, options: facets.tags },
          {
            key: 'links',
            legend: copy.facetLinks,
            mode: 'all',
            options: [
              { value: 'demo', label: copy.demo, count: facets.links.demo },
              {
                value: 'source',
                label: copy.openSource,
                count: facets.links.source,
              },
            ].filter((option) => option.count > 0),
          },
        ]}
      />
      <ProjectGrid
        id="project-grid"
        lang={lang}
        copy={copy}
        projects={projects}
      />
    </>
  )
}
