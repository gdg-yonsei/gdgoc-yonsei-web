import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { connection } from 'next/server'
import PageTitle from '@/app/components/page-title'
import StageButtonGroup from '@/app/components/stage-button-group'
import { i18n } from '@/i18n-config'
import { getSessionVisibilityBucket } from '@/lib/server/cache/policy'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { getPublishedSessionsByGeneration } from '@/lib/server/queries/public/sessions'

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
      title: `${generation} 세션`,
      description: `GDGoC Yonsei에서 최첨단 기술을 소개하고 자신의 경험을 나누는 세션을 만나보세요.`,
    }
  }

  return {
    title: `${generation} Sessions`,
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
  const generationList = await getGenerationSummaries(i18n.defaultLocale)
  return generationList.map((generation) => ({ generation: generation.name }))
}

/**
 * `SessionPage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
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
export default async function SessionPage({ params }: Props) {
  const paramsData = await params
  const locale = paramsData.lang === 'ko' ? 'ko' : 'en'

  await connection()
  const visibilityBucket = getSessionVisibilityBucket()

  const sessionList = await getPublishedSessionsByGeneration(
    paramsData.generation,
    locale,
    visibilityBucket
  )

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <PageTitle>{paramsData.lang === 'ko' ? '세션' : 'Sessions'}</PageTitle>
      <StageButtonGroup
        basePath={'session'}
        generation={paramsData.generation}
        lang={locale}
      />
      <div
        className={
          'mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 p-4 lg:grid-cols-2'
        }
      >
        {sessionList?.length === 0 && (
          <p>
            {paramsData.lang === 'ko'
              ? '해당 기수에서 세션을 찾을 수 없습니다.'
              : 'There are no sessions for this generation.'}
          </p>
        )}
        {sessionList?.map((session, i) => (
          <Link
            href={`/${paramsData.lang}/session/${paramsData.generation}/${session.id}`}
            key={i}
            className={`flex rounded-lg border-1 border-neutral-300 bg-white`}
          >
            <Image
              src={session.mainImage}
              width={200}
              height={200}
              alt={
                paramsData.lang === 'ko'
                  ? session.nameKo
                    ? session.nameKo
                    : ''
                  : session.name
              }
              className={'aspect-5/4 w-1/2 rounded-l-lg object-cover'}
            />
            <div className={'flex w-1/2 flex-col justify-between p-2'}>
              <h2 className={'text-2xl font-semibold'}>
                {paramsData.lang === 'ko' ? session.nameKo : session.name}
              </h2>
              <div className={'flex flex-col items-end'}>
                <p>
                  {session.startAt
                    ? new Intl.DateTimeFormat('ko-KR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour12: false,
                      }).format(new Date(session.startAt))
                    : 'TBD'}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
