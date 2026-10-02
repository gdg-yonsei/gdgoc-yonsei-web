import type { Metadata } from 'next'
import ArchiveHubShell from '@/app/components/site/archive-hub-shell'
import {
  ArchiveListSkeleton,
  ProjectCardSkeletons,
} from '@/app/components/site/skeletons'
import JsonLd from '@/app/components/json-ld'
import EmptyState from '@/app/components/site/empty-state'
import FilterBar from '@/app/components/site/filter-bar'
import GenerationStrip from '@/app/components/site/generation-strip'
import ProjectGrid from '@/app/components/site/project-grid/project-grid'
import {
  archiveCommonCopy,
  projectArchiveCopy,
  projectFilterCopy,
} from '@/lib/contents/archive-copy'
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
import { localeStaticParams, toLocale } from '@/lib/i18n'
import { projectPath } from '@/lib/site/routes'

type Props = { params: Promise<{ lang: string }> }

const en = projectArchiveCopy.en
const ko = projectArchiveCopy.ko

export function generateStaticParams() {
  return localeStaticParams()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).lang)
  const copy = projectArchiveCopy[locale]

  return createLocalizedMetadata({
    locale,
    path: '/project',
    title: copy.hubTitle,
    description: copy.hubDescription,
  })
}

export default function ProjectHubPage({ params }: Props) {
  return (
    <ArchiveHubShell
      params={params}
      section="projects"
      testId="project-showcase-shell"
      tag={en.tag}
      title={{ en: en.hubTitle, ko: ko.hubTitle }}
      description={{ en: en.hubDescription, ko: ko.hubDescription }}
      fallback={
        <ArchiveListSkeleton label="Loading projects">
          <ProjectCardSkeletons />
        </ArchiveListSkeleton>
      }
    >
      <ProjectHubContent params={params} />
    </ArchiveHubShell>
  )
}

async function ProjectHubContent({ params }: Props) {
  const lang = toLocale((await params).lang)
  const copy = projectArchiveCopy[lang]
  const common = archiveCommonCopy[lang]
  const [showcase, generations] = await Promise.all([
    getProjectShowcase(),
    getGenerationSummaries(),
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
                projectPath(project.generationName, project.id)
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
