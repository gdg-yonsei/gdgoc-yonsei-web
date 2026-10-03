/**
 * 프로젝트 상세 페이지(`/{lang}/project/{기수}/{id}`). URL의 기수가 실제와 다르면 404.
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import JsonLd from '@/app/components/json-ld'
import PageTransition from '@/app/components/site/page-transition'
import ProjectDetailView from '@/app/components/site/project-detail/project-detail-view'
import type { Locale } from '@/lib/i18n'
import {
  archiveCommonCopy,
  projectArchiveCopy,
} from '@/lib/contents/archive-copy'
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
import { pickLocalized } from '@/lib/i18n'
import { getLocale } from '@/lib/i18n/server'
import { generationPath, projectPath } from '@/lib/site/routes'

type Props = PageProps<'/[lang]/project/[generation]/[projectId]'>

async function loadProject(
  projectId: string,
  generation: string,
  locale: Locale
) {
  const [row, showcase] = await Promise.all([
    getProjectById(projectId),
    getProjectShowcase(),
  ])

  if (!row || row.generation.name !== generation) {
    return null
  }

  return {
    project: {
      ...toShowcaseProject(row),
      content:
        pickLocalized(locale, { en: row.content, ko: row.contentKo }) ?? '',
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

/** 언어별 제목·설명·대체 언어 링크(hreflang) 메타데이터. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { generation, projectId } = await params
  const locale = await getLocale()
  const loaded = await loadProject(projectId, generation, locale)

  if (!loaded) {
    notFound()
  }

  const title = projectTitle(loaded.project, locale)
  return createLocalizedMetadata({
    locale,
    path: projectPath(generation, projectId),
    title,
    description: summarizeForMetadata(
      projectSummary(loaded.project, locale),
      fallbackDescription(locale, title, generation)
    ),
    generatedSocialImage: true,
  })
}

/** 페이지 본문. */
export default async function ProjectDetailPage({ params }: Props) {
  const { generation, projectId } = await params

  return (
    <PageTransition>
      <Suspense fallback={<ProjectDetailLoading />}>
        <ProjectDetail generation={generation} projectId={projectId} />
      </Suspense>
    </PageTransition>
  )
}

async function ProjectDetail({
  generation,
  projectId,
}: {
  generation: string
  projectId: string
}) {
  const locale = await getLocale()
  const loaded = await loadProject(projectId, generation, locale)

  if (!loaded) {
    notFound()
  }

  const { project, showcase } = loaded
  const copy = projectArchiveCopy[locale]
  const common = archiveCommonCopy[locale]
  const title = projectTitle(project, locale)
  const url = getLocalizedUrl(locale, projectPath(generation, projectId))

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
              url: getLocalizedUrl(
                locale,
                generationPath('project', generation)
              ),
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
