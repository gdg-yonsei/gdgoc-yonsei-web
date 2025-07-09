import { getSession } from '@/lib/fetcher/get-session'
import { notFound } from 'next/navigation'
import PageTitle from '@/app/components/page-title'
import ImagesSliders from '@/app/components/images-slider'
import NavigationButton from '@/app/components/navigation-button'

export default function SessionPageContent({
  sessionData,
  isModal = false,
}: {
  sessionData: Awaited<ReturnType<typeof getSession>>
  isModal?: boolean
}) {
  if (!sessionData) {
    return notFound()
  }

  return (
    <div className={'w-full pb-4'}>
      {!isModal && (
        <NavigationButton href={'/session'}>
          <p>Sessions</p>
        </NavigationButton>
      )}
      <PageTitle>{sessionData.name}</PageTitle>
      <ImagesSliders images={[sessionData.mainImage, ...sessionData.images]} />
      <div className={'mx-auto w-full max-w-4xl py-8'}>
        <p className={'px-4 text-xl font-semibold'}>Contents</p>
        <p className={'px-4'}>{sessionData.description}</p>
      </div>
    </div>
  )
}
