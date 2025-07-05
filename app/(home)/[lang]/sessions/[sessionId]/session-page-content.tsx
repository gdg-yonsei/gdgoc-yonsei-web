import { getSession } from '@/lib/fetcher/get-session'
import { notFound } from 'next/navigation'
import PageTitle from '@/app/components/page-title'
import ImagesSliders from '@/app/components/images-slider'

export default function SessionPageContent({
  sessionData,
}: {
  sessionData: Awaited<ReturnType<typeof getSession>>
}) {
  if (!sessionData) {
    return notFound()
  }

  return (
    <div className={'w-full pb-4'}>
      <PageTitle>{sessionData.name}</PageTitle>
      <ImagesSliders images={[sessionData.mainImage, ...sessionData.images]} />
      <div className={'mx-auto w-full max-w-4xl py-8'}>
        <p className={'px-4 text-xl font-semibold'}>Contents</p>
        <p className={'px-4'}>{sessionData.description}</p>
      </div>
    </div>
  )
}
