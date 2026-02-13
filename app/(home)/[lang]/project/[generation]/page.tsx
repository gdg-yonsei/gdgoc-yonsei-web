import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import formatDateYYYYMMDD from '@/lib/format-date-yyyy-mm-dd'
import db from '@/db'
import { eq } from 'drizzle-orm'
import { generations } from '@/db/schema/generations'
import PageTitle from '@/app/components/page-title'
import StageButtonGroup from '@/app/components/stage-button-group'
import getGenerationSummaries from '@/lib/server/fetcher/getGenerationList'
import addLangParams from '@/lib/server/add-lang-params'
import applyCacheTags from '@/lib/server/cacheTagT'

export const dynamicParams = true
export const dynamic = 'force-static'

type Props = {
  params: Promise<{ lang: string; generation: string }>
}

/**
 * `generateMetadata` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
 *
 * 구동 원리:
 * 1. 입력값(`Props`)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
 * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
 * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
 *
 * 작동 결과:
 * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
 * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, generation } = await params

  if (lang === 'ko') {
    return {
      title: `${generation} 프로젝트`,
      description: `GDGoC Yonsei에서 개발자들이 최첨단 기술을 활용해 임팩트 있는 솔루션을 만드는 혁신적인 프로젝트들을 만나보세요.`,
    }
  }

  return {
    title: `${generation} Projects`,
    description:
      'Discover innovative projects by GDGoC Yonsei, where developers collaborate to build impactful solutions using cutting-edge technologies. Explore our work and get inspired!',
  }
}

/**
 * `generateStaticParams` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
 * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
 * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
 *
 * 작동 결과:
 * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
 * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
 */
export async function generateStaticParams() {
  const generationList = await getGenerationSummaries()
  return addLangParams(
    generationList.map((generation) => ({ generation: generation.name })),
    ['en', 'ko']
  )
}

/**
 * `ProjectsPage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`Props`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
export default async function ProjectsPage({ params }: Props) {
  'use cache'
  applyCacheTags('projects', 'generations')
  const paramsData = await params

  const generationData = await db.query.generations.findFirst({
    where: eq(generations.name, paramsData.generation),
    with: {
      projects: true,
    },
  })

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <PageTitle>
        {paramsData.lang === 'ko' ? '프로젝트' : 'Projects'}
      </PageTitle>
      <StageButtonGroup
        basePath={'project'}
        generation={paramsData.generation}
        lang={paramsData.lang}
      />
      <div
        className={
          'mx-auto grid w-full max-w-4xl grid-cols-1 gap-2 p-4 md:grid-cols-2 lg:grid-cols-3'
        }
      >
        {generationData?.projects.length === 0 && (
          <p>
            {paramsData.lang === 'ko'
              ? '해당 기수에서 프로젝트를 찾을 수 없습니다.'
              : 'There are no projects for this generation'}
          </p>
        )}
        {generationData?.projects.map((data, i) => (
          <Link
            href={`/${paramsData.lang}/project/${paramsData.generation}/${data?.id}`}
            key={i}
            className={'ring-gdg-white rounded-lg bg-white ring-2'}
          >
            <Image
              src={data?.mainImage}
              width={200}
              height={200}
              alt={data?.name}
              className={'aspect-3/2 w-full rounded-t-lg object-cover'}
            />
            <div className={'p-3'}>
              <h2 className={'pb-2 text-2xl font-semibold'}>
                {paramsData.lang === 'ko' ? data?.nameKo : data?.name}
              </h2>
              <p className={'text-sm'}>
                {formatDateYYYYMMDD(new Date(data?.updatedAt))}
              </p>
              <p className={'text-sm'}>
                {paramsData.lang === 'ko'
                  ? data?.descriptionKo
                  : data?.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
