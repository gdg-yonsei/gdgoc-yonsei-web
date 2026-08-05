import type { Metadata } from 'next'
import UserProfileCard from '@/app/(home)/[lang]/member/[generation]/user-profile-card'
import PageTitle from '@/app/components/page-title'
import StageButtonGroup from '@/app/components/stage-button-group'
import { getMembersByGeneration } from '@/lib/server/queries/public/members'
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
  const generationData = await getMembersByGeneration(generation, locale)

  if (!generationData) {
    notFound()
  }

  if (locale === 'ko') {
    return createLocalizedMetadata({
      locale,
      path: `/member/${generation}`,
      title: `${generation} 구성원`,
      description: `GDGoC Yonsei ${generation} 기수의 파트별 구성원과 학생 개발자 프로필을 확인하고 연세대학교 개발자 커뮤니티의 활동 분야를 만나보세요.`,
    })
  }

  return createLocalizedMetadata({
    locale,
    path: `/member/${generation}`,
    title: `${generation} Members`,
    description: `Meet the GDGoC Yonsei ${generation} members across each technical and community team, and discover the people building Yonsei's student developer community.`,
  })
}

export default async function MembersPage({ params }: Props) {
  const paramsData = await params
  const locale = paramsData.lang === 'ko' ? 'ko' : 'en'
  const generationData = await getMembersByGeneration(
    paramsData.generation,
    locale
  )

  if (!generationData) {
    notFound()
  }

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <PageTitle>{paramsData.lang === 'ko' ? '구성원' : 'Members'}</PageTitle>
      <StageButtonGroup
        basePath={'member'}
        generation={paramsData.generation}
        lang={locale}
      />
      <div className={'flex w-full flex-col gap-8'}>
        {generationData.parts.map((part, i) => (
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
