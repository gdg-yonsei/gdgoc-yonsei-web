import { getSession } from '@/lib/server/fetcher/get-session'
import { notFound } from 'next/navigation'
import PageTitle from '@/app/components/page-title'
import ImagesSliders from '@/app/components/images-slider'
import NavigationButton from '@/app/components/navigation-button'

export default function SessionPageContent({
  sessionData,
  lang,
  isModal = false,
}: {
  sessionData: Awaited<ReturnType<typeof getSession>>
  lang: string
  isModal?: boolean
}) {
  if (!sessionData) {
    return notFound()
  }

  return (
    <div className={'w-full pb-4'}>
      {!isModal && (
        <NavigationButton href={'/sessions'}>
          <p>Sessions</p>
        </NavigationButton>
      )}
      <PageTitle>
        {lang === 'ko' ? sessionData.nameKo : sessionData.name}
      </PageTitle>
      <ImagesSliders images={[sessionData.mainImage, ...sessionData.images]} />
      <div className={'mx-auto w-full max-w-4xl py-8'}>
        <p className={'px-4 text-xl font-semibold'}>
          {lang === 'ko' ? '세션 내용' : 'Contents'}
        </p>
        <p className={'px-4'}>
          {lang === 'ko' ? sessionData.descriptionKo : sessionData.description}
        </p>
      </div>
    </div>
  )
}
