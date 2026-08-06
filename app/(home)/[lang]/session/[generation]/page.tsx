import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { connection } from 'next/server'
import { Suspense } from 'react'
import PageTitle from '@/app/components/page-title'
import StageButtonGroup from '@/app/components/stage-button-group'
import { getSessionVisibilityBucket } from '@/lib/server/cache/policy'
import { getPublishedSessionsByGeneration } from '@/lib/server/queries/public/sessions'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { notFound } from 'next/navigation'
import languageParamChecker from '@/lib/language-param-checker'
import { createLocalizedMetadata } from '@/lib/seo/metadata'
import type { Locale } from '@/i18n-config'

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
  const generationList = await getGenerationSummaries(locale)

  if (!generationList.some(({ name }) => name === generation)) {
    notFound()
  }

  if (locale === 'ko') {
    return createLocalizedMetadata({
      locale,
      path: `/session/${generation}`,
      title: `${generation} 세션`,
      description: `GDGoC Yonsei에서 최첨단 기술을 소개하고 자신의 경험을 나누는 세션을 만나보세요.`,
    })
  }

  return createLocalizedMetadata({
    locale,
    path: `/session/${generation}`,
    title: `${generation} Sessions`,
    description:
      'Browse GDGoC Yonsei technical sessions where student developers share practical knowledge, project experience, and emerging technology with the community.',
  })
}

function SessionListLoading({ lang }: { lang: Locale }) {
  return (
    <div
      role="status"
      aria-label={lang === 'ko' ? '세션 불러오는 중' : 'Loading sessions'}
      className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 p-4 lg:grid-cols-2"
    >
      <div className="h-44 animate-pulse rounded-2xl bg-neutral-200 motion-reduce:animate-none" />
      <div className="h-44 animate-pulse rounded-2xl bg-neutral-200 motion-reduce:animate-none" />
    </div>
  )
}

async function SessionList({
  generation,
  locale,
}: {
  generation: string
  locale: Locale
}) {
  await connection()
  const visibilityBucket = getSessionVisibilityBucket()
  const sessionList = await getPublishedSessionsByGeneration(
    generation,
    locale,
    visibilityBucket
  )

  return (
    <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 p-4 lg:grid-cols-2">
      {sessionList.length === 0 && (
        <p className="rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-700 lg:col-span-2">
          {locale === 'ko'
            ? '해당 기수에서 세션을 찾을 수 없습니다.'
            : 'There are no sessions for this generation.'}
        </p>
      )}
      {sessionList.map((session) => {
        const sessionName =
          locale === 'ko' ? session.nameKo || session.name : session.name

        return (
          <Link
            href={`/${locale}/session/${generation}/${session.id}`}
            key={session.id}
            className="group flex min-h-44 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 active:scale-[0.98] motion-reduce:transform-none"
          >
            <Image
              src={session.mainImage}
              width={200}
              height={200}
              alt={sessionName}
              sizes="(max-width: 1024px) 50vw, 432px"
              className="aspect-5/4 w-2/5 object-cover sm:w-1/2"
            />
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-4">
              <h2 className="text-xl leading-tight font-semibold break-words sm:text-2xl">
                {sessionName}
              </h2>
              {session.startAt ? (
                <time
                  dateTime={session.startAt.toISOString()}
                  className="text-sm text-neutral-600"
                >
                  {new Intl.DateTimeFormat(
                    locale === 'ko' ? 'ko-KR' : 'en-US',
                    {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour12: false,
                    }
                  ).format(new Date(session.startAt))}
                </time>
              ) : (
                <p className="text-sm text-neutral-600">TBD</p>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default async function SessionPage({ params }: Props) {
  const paramsData = await params
  const locale = paramsData.lang === 'ko' ? 'ko' : 'en'
  const generationList = await getGenerationSummaries(locale)

  if (!generationList.some(({ name }) => name === paramsData.generation)) {
    notFound()
  }

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <PageTitle>{paramsData.lang === 'ko' ? '세션' : 'Sessions'}</PageTitle>
      <StageButtonGroup
        basePath={'session'}
        generation={paramsData.generation}
        lang={locale}
      />
      <Suspense fallback={<SessionListLoading lang={locale} />}>
        <SessionList generation={paramsData.generation} locale={locale} />
      </Suspense>
    </div>
  )
}
