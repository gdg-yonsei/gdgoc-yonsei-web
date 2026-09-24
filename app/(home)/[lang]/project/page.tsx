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
import ProjectGrid from '@/app/components/site/project-grid/project-grid'
import {
  archiveCommonCopy,
  projectArchiveCopy,
  projectFilterCopy,
} from '@/lib/contents/archive-copy'
import languageParamChecker from '@/lib/language-param-checker'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { getProjectShowcase } from '@/lib/server/queries/public/projects'
import {
  createLocalizedMetadata,
  getLocalizedUrl,
  getSiteUrl,
} from '@/lib/seo/metadata'
import { countByGeneration, generationStrip } from '@/lib/site/generations'
import { breadcrumbList, collectionPage } from '@/lib/site/json-ld'
import {
  projectFacets,
  projectTitle,
  sortShowcase,
} from '@/lib/site/project-showcase'

type Props = { params: Promise<{ lang: string }> }

const en = projectArchiveCopy.en
const ko = projectArchiveCopy.ko

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = languageParamChecker((await params).lang)
  const copy = projectArchiveCopy[locale]

  return createLocalizedMetadata({
    locale,
    path: '/project',
    title: copy.hubTitle,
    description: copy.hubDescription,
  })
}

/* Same shell pattern as the Session Log: nothing above the fold reads params. */
export default function ProjectHubPage({ params }: Props) {
  return (
    <PageTransition>
      <div className="site-page" data-testid="project-showcase-shell">
        <Suspense
          fallback={
            <div aria-hidden="true" className="site-breadcrumbs-skeleton" />
          }
        >
          <HubBreadcrumbs params={params} section="projects" />
        </Suspense>
        <PageHeader
          tag={en.tag}
          title={<LocalizedText en={en.hubTitle} ko={ko.hubTitle} />}
          description={
            <LocalizedText en={en.hubDescription} ko={ko.hubDescription} />
          }
        />
        <Suspense fallback={<ProjectGridFallback />}>
          <ProjectHubContent params={params} />
        </Suspense>
      </div>
    </PageTransition>
  )
}

function ProjectGridFallback() {
  return (
    <div
      role="status"
      aria-label="Loading projects"
      className="archive-skeleton"
    >
      <span className="skeleton-bar h-10 w-72 max-w-full" />
      <span className="skeleton-bar h-36 w-full rounded-3xl" />
      <div className="release-grid">
        {Array.from({ length: 3 }, (_, index) => (
          <span key={index} className="skeleton-bar aspect-[4/5] rounded-3xl" />
        ))}
      </div>
    </div>
  )
}

async function ProjectHubContent({ params }: Props) {
  const lang = languageParamChecker((await params).lang)
  const copy = projectArchiveCopy[lang]
  const common = archiveCommonCopy[lang]
  const [showcase, generations] = await Promise.all([
    getProjectShowcase(),
    getGenerationSummaries(lang),
  ])
  const projects = sortShowcase(showcase)
  const facets = projectFacets(projects)
  const url = getLocalizedUrl(lang, '/project')

  return (
    <>
      <JsonLd
        id="project-showcase-structured-data"
        data={[
          ...collectionPage({
            url,
            name: copy.hubTitle,
            description: copy.hubDescription,
            locale: lang,
            websiteId: `${getSiteUrl()}#website`,
            items: projects.map((project) => ({
              name: projectTitle(project, lang),
              url: getLocalizedUrl(
                lang,
                `/project/${project.generationName}/${project.id}`
              ),
            })),
          }),
          breadcrumbList([
            { name: common.home, url: getLocalizedUrl(lang) },
            { name: common.projects, url },
          ]),
        ]}
      />
      <GenerationStrip
        basePath="project"
        lang={lang}
        label={common.generations}
        emptyLabel={common.noRecords}
        generations={generationStrip(generations, countByGeneration(projects))}
      />
      {projects.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={copy.emptyTitle} body={copy.emptyBody} />
        </div>
      ) : (
        <>
          <FilterBar
            scope="project-grid"
            total={projects.length}
            copy={projectFilterCopy(lang)}
            facets={[
              {
                key: 'generation',
                legend: copy.facetGeneration,
                options: facets.generations,
              },
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
      )}
    </>
  )
}
