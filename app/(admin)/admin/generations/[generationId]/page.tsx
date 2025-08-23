import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { getGeneration } from '@/lib/server/fetcher/admin/get-generation'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import GenerationActivityPeriod from '@/app/components/admin/generation-activity-period'
import { notFound } from 'next/navigation'
import DataEditLink from '@/app/components/admin/data-edit-link'
import { auth } from '@/auth'
import DataDeleteButton from '@/app/components/admin/data-delete-button'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ generationId: string }>
}) {
  const { generationId } = await params
  // generation 데이터 가져오기
  const generationData = await getGeneration(Number(generationId))

  return {
    title: `Generation: ${generationData?.name}`,
  }
}

export default async function GenerationPage({
  params,
}: {
  params: Promise<{ generationId: string }>
}) {
  const { generationId } = await params
  // generation 데이터 가져오기
  const generationData = await getGeneration(Number(generationId))
  // generation 데이터가 없을 경우 404 페이지로 이동
  if (!generationData) {
    notFound()
  }
  // 사용자 권한 가져오기
  const session = await auth()

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/generations'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>Generations</p>
      </AdminNavigationButton>
      <div className={'flex items-center gap-2'}>
        <div className={'admin-title'}>Generation: {generationData.name}</div>
        <DataEditLink
          session={session}
          dataId={generationId}
          dataType={'generations'}
          href={`/admin/generations/${generationId}/edit`}
        />
        <DataDeleteButton
          session={session}
          dataType={'generations'}
          dataId={generationId}
        />
      </div>
      <div
        className={
          'mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        }
      >
        <div className={'member-data-box col-span-1 sm:col-span-2'}>
          <div className={'member-data-title'}>Activity Period</div>
          <GenerationActivityPeriod
            className={'member-data-content flex items-center gap-2'}
            startDate={generationData.startDate}
            endDate={generationData.endDate}
          />
        </div>
        <div className={'col-span-4 flex flex-col gap-2 py-4'}>
          <div className={'member-data-title'}>Parts</div>
          <div
            className={
              'grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            }
          >
            {generationData.parts.map((part) => (
              <div key={part.id} className={'member-data-box'}>
                <div className={'member-data-content'}>{part.name}</div>
                <div>Member: {part.usersToParts.length}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminDefaultLayout>
  )
}
