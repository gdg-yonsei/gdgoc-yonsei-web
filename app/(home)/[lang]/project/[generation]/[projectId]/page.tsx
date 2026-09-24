import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import JsonLd from '@/app/components/json-ld'
import PageTransition from '@/app/components/site/page-transition'
import RevealSuspense from '@/app/components/site/reveal-suspense'
import ProjectDetailView from '@/app/components/site/project-detail/project-detail-view'
import type { Locale } from '@/i18n-config'
import {
  archiveCommonCopy,
  projectArchiveCopy,
} from '@/lib/contents/archive-copy'
import languageParamChecker from '@/lib/language-param-checker'
import {
  getProjectById,
  getProjectShowcase,
} from '@/lib/server/queries/public/projects'
import {
  createLocalizedMetadata,
  getAbsoluteUrl,
  getLocalizedUrl,
  getSiteUrl,
  summarizeForMetadata,
} from '@/lib/seo/metadata'
import { breadcrumbList, projectWork } from '@/lib/site/json-ld'
import {
  contributorName,
  moreFromGeneration,
  nextProject,
  projectSummary,
  projectTitle,
  sortShowcase,
  toShowcaseProject,
} from '@/lib/site/project-showcase'
import ProjectDetailLoading from './loading'

type Props = {
  params: Promise<{ projectId: string; lang: string; generation: string }>
}

async function loadProject(
  projectId: string,
  generation: string,
  locale: Locale
) {
  const [row, showcase] = await Promise.all([
    getProjectById(projectId, locale),
    getProjectShowcase(),
  ])

  if (!row || row.generation.name !== generation) {
    return null
  }

  return {
    project: {
      ...toShowcaseProject(row),
      content: locale === 'ko' ? row.contentKo || row.content : row.content,
      images: row.images,
    },
    showcase: sortShowcase(showcase),
  }
}

function fallbackDescription(
  locale: Locale,
  title: string,
  generation: string
) {
  return locale === 'ko'
    ? `GDGoC Yonsei ${generation} 기수의 ${title} 프로젝트를 소개합니다.`
    : `Explore ${title}, a GDGoC Yonsei ${generation} student project.`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, generation, projectId } = await params
  const locale = languageParamChecker(lang)
  const loaded = await loadProject(projectId, generation, locale)

  if (!loaded) {
    notFound()
  }

  const title = projectTitle(loaded.project, locale)
  return createLocalizedMetadata({
    locale,
    path: `/project/${generation}/${projectId}`,
    title,
    description: summarizeForMetadata(
      projectSummary(loaded.project, locale),
      fallbackDescription(locale, title, generation)
    ),
    generatedSocialImage: true,
  })
}

export default async function ProjectDetailPage({ params }: Props) {
  const resolved = await params

  return (
    <PageTransition>
      <RevealSuspense fallback={<ProjectDetailLoading />}>
        <ProjectDetail {...resolved} />
      </RevealSuspense>
    </PageTransition>
  )
}

async function ProjectDetail({
  lang,
  generation,
  projectId,
}: {
  lang: string
  generation: string
  projectId: string
}) {
  const locale = languageParamChecker(lang)
  const loaded = await loadProject(projectId, generation, locale)

  if (!loaded) {
    notFound()
  }

  const { project, showcase } = loaded
  const copy = projectArchiveCopy[locale]
  const common = archiveCommonCopy[locale]
  const title = projectTitle(project, locale)
  const url = getLocalizedUrl(locale, `/project/${generation}/${projectId}`)

  return (
    <div className="site-page">
      <JsonLd
        id="project-structured-data"
        data={[
          projectWork({
            url,
            name: title,
            description: summarizeForMetadata(
              projectSummary(project, locale),
              fallbackDescription(locale, title, generation)
            ),
            images: [project.mainImage, ...project.images].map(getAbsoluteUrl),
            locale,
            dateCreated: project.createdAt,
            dateModified: project.updatedAt,
            keywords: project.tags,
            creators: project.contributors.map((contributor) =>
              contributorName(contributor, locale)
            ),
            repoUrl: project.repoUrl,
            publisherId: `${getSiteUrl()}#organization`,
          }),
          breadcrumbList([
            { name: common.home, url: getLocalizedUrl(locale) },
            {
              name: common.projects,
              url: getLocalizedUrl(locale, '/project'),
            },
            {
              name: generation,
              url: getLocalizedUrl(locale, `/project/${generation}`),
            },
            { name: title, url },
          ]),
        ]}
      />
      <ProjectDetailView
        lang={locale}
        copy={copy}
        common={common}
        project={project}
        more={moreFromGeneration(showcase, project)}
        next={nextProject(showcase, project.id)}
      />
    </div>
  )
}
