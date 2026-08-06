import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import PageTitle from '@/app/components/page-title'
import StageButtonGroup from '@/app/components/stage-button-group'
import { getProjectsByGeneration } from '@/lib/server/queries/public/projects'
import { notFound } from 'next/navigation'
import languageParamChecker from '@/lib/language-param-checker'
import { createLocalizedMetadata } from '@/lib/seo/metadata'

// 이 라우트는 렌더링 전에 기수/상세 ID를 DB로 검증해 `notFound()`를 호출하므로,
// Suspense 경계 밖에서 캐시되지 않은 데이터(params, 검증 쿼리)에 접근합니다.
// cacheComponents 환경에서는 그런 접근이 프리렌더 오류이므로 blocking 라우트로 선언합니다.
// (`notFound()`는 noindex 404 페이지를 렌더링하지만, 셸이 이미 전송된 뒤라 상태 코드는 200입니다.)
export const instant = false

type Props = {
  params: Promise<{ lang: string; generation: string }>
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

export default async function ProjectsPage({ params }: Props) {
  const paramsData = await params
  const locale = paramsData.lang === 'ko' ? 'ko' : 'en'
  const generationData = await getProjectsByGeneration(
    paramsData.generation,
    locale
  )

  if (!generationData) {
    notFound()
  }

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <PageTitle>
        {paramsData.lang === 'ko' ? '프로젝트' : 'Projects'}
      </PageTitle>
      <StageButtonGroup
        basePath={'project'}
        generation={paramsData.generation}
        lang={locale}
      />
      <div
        className={
          'mx-auto grid w-full max-w-4xl grid-cols-1 gap-2 p-4 md:grid-cols-2 lg:grid-cols-3'
        }
      >
        {generationData.projects.length === 0 && (
          <p>
            {paramsData.lang === 'ko'
              ? '해당 기수에서 프로젝트를 찾을 수 없습니다.'
              : 'There are no projects for this generation'}
          </p>
        )}
        {generationData.projects.map((data) => {
          const projectName =
            locale === 'ko' ? data.nameKo || data.name : data.name

          return (
            <Link
              href={`/${paramsData.lang}/project/${paramsData.generation}/${data.id}`}
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
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 288px"
                className={'aspect-3/2 w-full rounded-t-lg object-cover'}
              />
              <div className={'p-3'}>
                <h2 className={'pb-2 text-2xl font-semibold'}>{projectName}</h2>
                <p className={'text-sm'}>
                  {new Intl.DateTimeFormat(
                    locale === 'ko' ? 'ko-KR' : 'en-US',
                    { dateStyle: 'medium' }
                  ).format(new Date(data.updatedAt))}
                </p>
                <p className={'text-sm'}>
                  {locale === 'ko' ? data.descriptionKo : data.description}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
