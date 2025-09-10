import { getSession } from '@/lib/server/fetcher/get-session'
import { notFound } from 'next/navigation'
import PageTitle from '@/app/components/page-title'
import ImagesSliders from '@/app/components/images-slider'
import NavigationButton from '@/app/components/navigation-button'
import SafeMDX from '@/app/components/safe-mdx'

export default function SessionPageContent({
  sessionData,
  lang,
  generation,
  isModal = false,
}: {
  sessionData: Awaited<ReturnType<typeof getSession>>
  lang: string
  generation: string
  isModal?: boolean
}) {
  if (!sessionData) {
    return notFound()
  }

  return (
    <div className={'w-full pb-4'}>
      {!isModal && (
        <NavigationButton href={`/${lang}/session/${generation}`}>
          <p>Sessions</p>
        </NavigationButton>
      )}
      <PageTitle>
        {lang === 'ko' ? sessionData.nameKo : sessionData.name}
      </PageTitle>
      <ImagesSliders images={[sessionData.mainImage, ...sessionData.images]} />

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
        <div className={'prose px-4'}>
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
  )
}
