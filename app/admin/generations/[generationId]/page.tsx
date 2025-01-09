import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { getGeneration } from '@/lib/fetcher/get-generation'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'

export default async function GenerationPage({
  params,
}: {
  params: Promise<{ generationId: string }>
}) {
  const { generationId } = await params
  const generationData = await getGeneration(Number(generationId))

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/generations'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>Generations</p>
      </AdminNavigationButton>
      <div className={'admin-title'}>Generation: {generationData.name}</div>
      <div className={'flex items-center gap-2 text-sm'}>
        <div>
          {new Intl.DateTimeFormat('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }).format(new Date(generationData.startDate))}
        </div>
        <div>-</div>
        <div>
          {generationData.endDate
            ? new Intl.DateTimeFormat('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }).format(new Date(generationData.endDate))
            : ''}
        </div>
      </div>
    </AdminDefaultLayout>
  )
}
