import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import PageTitle from '@/app/components/page-title'
import ImageSliderGallery from '@/app/components/images-slider'
import SafeMDX from '@/app/components/safe-mdx'
import NavigationButton from '@/app/components/navigation-button'
import type { Metadata } from 'next'
import { getCachedSessionVisibilityBucket } from '@/lib/server/cache/session-visibility'
import { getSessionById } from '@/lib/server/queries/public/sessions'
import languageParamChecker from '@/lib/language-param-checker'
import {
  createLocalizedMetadata,
  getAbsoluteUrl,
  getLocalizedUrl,
  getSiteUrl,
  summarizeForMetadata,
} from '@/lib/seo/metadata'
import JsonLd from '@/app/components/json-ld'

type Props = {
  params: Promise<{ lang: string; generation: string; sessionId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, generation, sessionId } = await params
  const locale = languageParamChecker(lang)

  const visibilityBucket = await getCachedSessionVisibilityBucket()
  const sessionData = await getSessionById(sessionId, locale, visibilityBucket)

  if (!sessionData || sessionData.part?.generation?.name !== generation) {
    notFound()
  }

  const title = locale === 'ko' ? sessionData.nameKo : sessionData.name
  const fallbackDescription =
    locale === 'ko'
      ? `GDGoC Yonsei ${generation} 기수의 ${title} 기술 세션을 소개합니다.`
      : `Learn from ${title}, a GDGoC Yonsei ${generation} technical session.`
  const description = summarizeForMetadata(
    locale === 'ko' ? sessionData.descriptionKo : sessionData.description,
    fallbackDescription
  )

  return createLocalizedMetadata({
    locale,
    path: `/session/${generation}/${sessionId}`,
    title,
    description,
    generatedSocialImage: true,
  })
}

function SessionDetailLoading({ lang }: { lang: string }) {
  return (
    <div
      role="status"
      aria-label={
        lang === 'ko' ? '세션 상세 불러오는 중' : 'Loading session details'
      }
      className="min-h-screen w-full pt-24"
    >
      <div className="mx-auto h-12 w-full max-w-4xl animate-pulse rounded-xl bg-neutral-200 motion-reduce:animate-none" />
      <div className="mx-auto mt-6 aspect-video w-full max-w-xl animate-pulse rounded-2xl bg-neutral-200 motion-reduce:animate-none" />
    </div>
  )
}

export default async function SessionPage({ params }: Props) {
  const resolvedParams = await params

  return (
    <Suspense fallback={<SessionDetailLoading lang={resolvedParams.lang} />}>
      <SessionDetail {...resolvedParams} />
    </Suspense>
  )
}

async function SessionDetail({
  sessionId,
  lang,
  generation,
}: {
  sessionId: string
  lang: string
  generation: string
}) {
  const visibilityBucket = await getCachedSessionVisibilityBucket()
  const sessionData = await getSessionById(
    sessionId,
    lang === 'ko' ? 'ko' : 'en',
    visibilityBucket
  )

  if (!sessionData || sessionData.part?.generation?.name !== generation) {
    return notFound()
  }

  const locale = lang === 'ko' ? 'ko' : 'en'
  const title = locale === 'ko' ? sessionData.nameKo : sessionData.name
  const description = summarizeForMetadata(
    locale === 'ko' ? sessionData.descriptionKo : sessionData.description,
    locale === 'ko'
      ? `GDGoC Yonsei ${generation} 기수의 ${title} 기술 세션을 소개합니다.`
      : `Learn from ${title}, a GDGoC Yonsei ${generation} technical session.`
  )
  const canonical = getLocalizedUrl(
    locale,
    `/session/${generation}/${sessionId}`
  )
  const sessionImages = [sessionData.mainImage, ...sessionData.images]
  const structuredData = sessionData.startAt
    ? {
        '@context': 'https://schema.org',
        '@type': 'Event',
        '@id': `${canonical}#event`,
        url: canonical,
        name: title,
        description,
        image: sessionImages.map(getAbsoluteUrl),
        inLanguage: locale,
        startDate: sessionData.startAt.toISOString(),
        ...(sessionData.endAt
          ? { endDate: sessionData.endAt.toISOString() }
          : {}),
        eventStatus: 'https://schema.org/EventCompleted',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        ...(locale === 'ko'
          ? sessionData.locationKo && {
              location: {
                '@type': 'Place',
                name: sessionData.locationKo,
              },
            }
          : sessionData.location && {
              location: {
                '@type': 'Place',
                name: sessionData.location,
              },
            }),
        organizer: { '@id': `${getSiteUrl()}#organization` },
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        '@id': `${canonical}#learning-resource`,
        url: canonical,
        name: title,
        description,
        image: sessionImages.map(getAbsoluteUrl),
        inLanguage: locale,
        provider: { '@id': `${getSiteUrl()}#organization` },
      }

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <JsonLd id="session-structured-data" data={structuredData} />
      <div className={'w-full pb-4'}>
        <NavigationButton href={`/${lang}/session/${generation}`}>
          <p>{locale === 'ko' ? '세션' : 'Sessions'}</p>
        </NavigationButton>
        <PageTitle>{title}</PageTitle>
        <ImageSliderGallery images={sessionImages} alt={title} />

        <div className={'mx-auto w-full max-w-4xl py-8'}>
          <div className={'p-4'}>
            <h2 className={'text-xl font-semibold'}>
              {lang === 'ko' ? '일정' : 'Event Time'}
            </h2>
            <div className={'flex gap-2'}>
              <p>
                {sessionData.startAt
                  ? new Intl.DateTimeFormat(
                      locale === 'ko' ? 'ko-KR' : 'en-US',
                      {
                        year: 'numeric',
                        month: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        day: 'numeric',
                        hour12: false,
                      }
                    ).format(new Date(sessionData.startAt))
                  : 'TBD'}
              </p>
              <p>-</p>
              <p>
                {sessionData.endAt
                  ? new Intl.DateTimeFormat(
                      locale === 'ko' ? 'ko-KR' : 'en-US',
                      {
                        year: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        hour12: false,
                      }
                    ).format(new Date(sessionData.endAt))
                  : 'TBD'}
              </p>
            </div>
          </div>
          <h2 className={'px-4 text-xl font-semibold'}>
            {lang === 'ko' ? '장소' : 'Location'}
          </h2>
          <p className={'px-4 pb-4'}>
            {lang === 'ko' ? sessionData.locationKo : sessionData.location}
          </p>
          <h2 className={'px-4 text-xl font-semibold'}>
            {lang === 'ko' ? '세션 내용' : 'Contents'}
          </h2>
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
