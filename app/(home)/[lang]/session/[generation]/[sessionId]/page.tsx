import { getSession } from '@/lib/server/fetcher/get-session'
import { notFound } from 'next/navigation'
import PageTitle from '@/app/components/page-title'
import ImageSliderGallery from '@/app/components/images-slider'
import SafeMDX from '@/app/components/safe-mdx'
import NavigationButton from '@/app/components/navigation-button'
import { Metadata } from 'next'
import getGenerationSummaries from '@/lib/server/fetcher/getGenerationList'
import getPublishedSessionsByGeneration from '@/app/(home)/[lang]/session/[generation]/getSessionList'

export const dynamicParams = true
export const dynamic = 'force-static'

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
  const sessionsData = await Promise.all(
    generationList.map(async (generation) => {
      const sessions = await getPublishedSessionsByGeneration(generation.name)
      return { generation: generation.name, sessions }
    })
  )

  const params: { sessionId: string; generation: string; lang: string }[] = []
  const langs = ['ko', 'en']

  for (const data of sessionsData) {
    if (data.sessions) {
      for (const session of data.sessions) {
        for (const lang of langs) {
          params.push({
            sessionId: session.id,
            generation: data.generation,
            lang,
          })
        }
      }
    }
  }

  return params
}

type Props = {
  params: Promise<{ lang: string; generation: string; sessionId: string }>
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
  const { lang, generation, sessionId } = await params
  const sessionData = await getSession(sessionId)

  if (!sessionData) {
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

  if (lang === 'ko') {
    return {
      title: `${sessionData.nameKo}`,
      description: `${sessionData.descriptionKo}`,
    }
  }

  return {
    title: `${sessionData.name}`,
    description: `${sessionData.description}`,
  }
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
  const { sessionId, lang, generation } = await params
  const sessionData = await getSession(sessionId)

  if (!sessionData) {
    return notFound()
  }

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <div className={'w-full pb-4'}>
        <NavigationButton href={`/${lang}/session/${generation}`}>
          <p>Sessions</p>
        </NavigationButton>
        <PageTitle>
          {lang === 'ko' ? sessionData.nameKo : sessionData.name}
        </PageTitle>
        <ImageSliderGallery
          images={[sessionData.mainImage, ...sessionData.images]}
        />

        <div className={'mx-auto w-full max-w-4xl py-8'}>
          <div className={'p-4'}>
            <p className={'text-xl font-semibold'}>
              {lang === 'ko' ? '일정' : 'Event Time'}
            </p>
            <div className={'flex gap-2'}>
              <p>
                {sessionData.startAt
                  ? new Intl.DateTimeFormat('ko-KR', {
                      year: 'numeric',
                      month: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                      day: 'numeric',
                      hour12: false,
                    }).format(new Date(sessionData.startAt))
                  : 'TBD'}
              </p>
              <p>-</p>
              <p>
                {sessionData.endAt
                  ? new Intl.DateTimeFormat('ko-KR', {
                      year: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      hour12: false,
                    }).format(new Date(sessionData.endAt))
                  : 'TBD'}
              </p>
            </div>
          </div>
          <p className={'px-4 text-xl font-semibold'}>
            {lang === 'ko' ? '장소' : 'Location'}
          </p>
          <p className={'px-4 pb-4'}>
            {lang === 'ko' ? sessionData.locationKo : sessionData.location}
          </p>
          <p className={'px-4 text-xl font-semibold'}>
            {lang === 'ko' ? '세션 내용' : 'Contents'}
          </p>
          <div className={'prose max-w-none px-4'}>
            <SafeMDX
              source={
                lang === 'ko'
                  ? sessionData.descriptionKo
                  : sessionData.description
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
