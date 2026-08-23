import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import PageTitle from '@/app/components/page-title'
import StageButtonGroup from '@/app/components/stage-button-group'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { getProjectsByGeneration } from '@/lib/server/queries/public/projects'
import { notFound } from 'next/navigation'
import languageParamChecker from '@/lib/language-param-checker'
import { createLocalizedMetadata } from '@/lib/seo/metadata'
import { getGenerationStaticParams } from '@/lib/server/queries/public/static-params'

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
  const generationData = await getProjectsByGeneration(generation, locale)

  if (!generationData) {
    notFound()
  }

  if (locale === 'ko') {
    return createLocalizedMetadata({
      locale,
      path: `/project/${generation}`,
      title: `${generation} 프로젝트`,
      description: `GDGoC Yonsei에서 개발자들이 최첨단 기술을 활용해 임팩트 있는 솔루션을 만드는 혁신적인 프로젝트들을 만나보세요.`,
    })
  }

  return createLocalizedMetadata({
    locale,
    path: `/project/${generation}`,
    title: `${generation} Projects`,
    description:
      'Explore GDGoC Yonsei student projects that turn technical learning into practical solutions through cross-functional collaboration at Yonsei University.',
  })
}

function ProjectGridLoading() {
  return (
    <div
      role="status"
      aria-label="Loading projects"
      className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-2 p-4 md:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-lg bg-white ring-2 ring-neutral-200"
        >
          <div className="aspect-3/2 w-full animate-pulse bg-neutral-200 motion-reduce:animate-none" />
          <div className="space-y-3 p-3">
            <div className="h-7 w-3/4 animate-pulse rounded-lg bg-neutral-200 motion-reduce:animate-none" />
            <div className="h-4 w-1/2 animate-pulse rounded-lg bg-neutral-200 motion-reduce:animate-none" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading projects</span>
    </div>
  )
}

async function ProjectGrid({
  generation,
  locale,
}: {
  generation: string
  locale: 'en' | 'ko'
}) {
  const generationData = await getProjectsByGeneration(generation, locale)

  if (!generationData) {
    return null
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-2 p-4 md:grid-cols-2 lg:grid-cols-3">
      {generationData.projects.length === 0 && (
        <p>
          {locale === 'ko'
            ? '해당 기수에서 프로젝트를 찾을 수 없습니다.'
            : 'There are no projects for this generation'}
        </p>
      )}
      {generationData.projects.map((data, index) => {
        const projectName =
          locale === 'ko' ? data.nameKo || data.name : data.name

        return (
          <Link
            href={`/${locale}/project/${generation}/${data.id}`}
            key={data.id}
            className={
              'interactive-card focus-ring ring-gdg-white block rounded-lg bg-white ring-2'
            }
          >
            <Image
              src={data.mainImage}
              width={200}
              height={200}
              alt={projectName}
              preload={index === 0}
              sizes="(max-width: 768px) calc(100vw - 2rem), (max-width: 1024px) 50vw, 288px"
              className={'aspect-3/2 w-full rounded-t-lg object-cover'}
            />
            <div className={'p-3'}>
              <h2 className={'pb-2 text-2xl font-semibold'}>{projectName}</h2>
              <p className={'text-sm'}>
                {new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
                  dateStyle: 'medium',
                }).format(new Date(data.updatedAt))}
              </p>
              <p className={'text-sm'}>
                {locale === 'ko' ? data.descriptionKo : data.description}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default async function ProjectsPage({ params }: Props) {
  const paramsData = await params
  const locale = paramsData.lang === 'ko' ? 'ko' : 'en'
  const generationList = await getGenerationSummaries(locale)

  if (!generationList.some(({ name }) => name === paramsData.generation)) {
    notFound()
  }

  return (
    <div className="min-h-screen w-full pt-20">
      <PageTitle>{locale === 'ko' ? '프로젝트' : 'Projects'}</PageTitle>
      <StageButtonGroup
        basePath="project"
        generation={paramsData.generation}
        lang={locale}
      />
      <Suspense fallback={<ProjectGridLoading />}>
        <ProjectGrid generation={paramsData.generation} locale={locale} />
      </Suspense>
    </div>
  )
}
