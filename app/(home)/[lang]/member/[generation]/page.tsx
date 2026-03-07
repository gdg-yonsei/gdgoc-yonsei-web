import type { Metadata } from 'next'
import UserProfileCard from '@/app/(home)/[lang]/member/[generation]/user-profile-card'
import PageTitle from '@/app/components/page-title'
import StageButtonGroup from '@/app/components/stage-button-group'
import { i18n } from '@/i18n-config'
import addLangParams from '@/lib/server/add-lang-params'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { getMembersByGeneration } from '@/lib/server/queries/public/members'

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
      title: `${generation} 구성원`,
      description: `GDGoC Yonsei ${generation} 구성원`,
    }
  }

  return {
    title: `${generation} Members`,
    description: `GDGoC Yonsei ${generation} Members`,
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
  return addLangParams(
    generationList.map((generation) => ({ generation: generation.name })),
    ['ko', 'en']
  )
}

/**
 * `MembersPage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
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
export default async function MembersPage({ params }: Props) {
  const paramsData = await params
  const locale = paramsData.lang === 'ko' ? 'ko' : 'en'
  const generationData = await getMembersByGeneration(
    paramsData.generation,
    locale
  )

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <PageTitle>{paramsData.lang === 'ko' ? '구성원' : 'Members'}</PageTitle>
      <StageButtonGroup
        basePath={'member'}
        generation={paramsData.generation}
        lang={locale}
      />
      <div className={'flex w-full flex-col gap-8'}>
        {generationData?.parts?.map((part, i) => (
          <div
            key={i}
            className={
              'flex flex-col gap-4 border-b-2 border-neutral-200 pb-24 last:border-b-0'
            }
          >
            <div className={'mx-auto w-full max-w-4xl px-4 text-4xl font-bold'}>
              {part.name}
            </div>
            <div
              className={
                'mx-auto grid w-full max-w-4xl grid-cols-1 gap-2 px-4 md:grid-cols-2 lg:grid-cols-3'
              }
            >
              {part.usersToParts?.map((user, j) => (
                <UserProfileCard
                  lang={paramsData.lang}
                  userData={user.user}
                  key={j}
                />
              ))}
              {part.usersToParts.length === 0 && (
                <div className={'text-neutral-600'}>There is no member.</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
