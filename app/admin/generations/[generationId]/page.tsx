import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { getGeneration } from '@/lib/fetcher/get-generation'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import GenerationActivityPeriod from '@/app/components/admin/generation-activity-period'
import { notFound } from 'next/navigation'
import DataEditLink from '@/app/components/admin/data-edit-link'
import { auth } from '@/auth'

export default async function GenerationPage({
  params,
}: {
  params: Promise<{ generationId: string }>
}) {
  const { generationId } = await params
  const generationData = await getGeneration(Number(generationId))
  if (!generationData) {
    notFound()
  }
  const session = await auth()

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/generations'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>Generations</p>
      </AdminNavigationButton>
      <div className={'flex gap-2 items-center'}>
        <div className={'admin-title'}>Generation: {generationData.name}</div>
        <DataEditLink
          session={session}
          dataId={generationId}
          dataType={'generations'}
          href={`/admin/generations/${generationId}/edit`}
        />
      </div>
      <div
        className={
          'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-4 gap-2'
        }
      >
        <div className={'member-data-box col-span-1 sm:col-span-2'}>
          <div className={'member-data-title'}>Activity Period</div>
          <GenerationActivityPeriod
            className={'member-data-context flex gap-2 items-center'}
            startDate={generationData.startDate}
            endDate={generationData.endDate}
          />
        </div>
        <div className={'py-4 col-span-4 flex flex-col gap-2'}>
          <div className={'member-data-title'}>Parts</div>
          <div
            className={
              'w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2'
            }
          >
            {generationData.parts.map((part) => (
              <div key={part.id} className={'member-data-box'}>
                <div className={'member-data-context'}>{part.name}</div>
                <div>Member: {part.usersToParts.length}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminDefaultLayout>
  )
}
