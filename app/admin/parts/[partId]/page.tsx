import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { notFound } from 'next/navigation'
import DataEditLink from '@/app/components/admin/data-edit-link'
import { auth } from '@/auth'
import { getPart } from '@/lib/fetcher/get-part'

export default async function PartPage({
  params,
}: {
  params: Promise<{ partId: string }>
}) {
  const { partId } = await params
  const partData = await getPart(Number(partId))
  if (!partData) {
    notFound()
  }
  const session = await auth()

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/parts'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>Parts</p>
      </AdminNavigationButton>
      <div className={'flex gap-2 items-center'}>
        <div className={'admin-title'}>{partData.name}</div>
        <DataEditLink
          session={session}
          dataId={partId}
          dataType={'parts'}
          href={`/admin/parts/${partId}/edit`}
        />
      </div>
      <div className={'member-data-grid'}></div>
    </AdminDefaultLayout>
  )
}
