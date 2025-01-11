import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { notFound } from 'next/navigation'
import DataEditLink from '@/app/components/admin/data-edit-link'
import { auth } from '@/auth'
import { getPart } from '@/lib/fetcher/get-part'
import formatUserName from '@/lib/format-user-name'
import { getGeneration } from '@/lib/fetcher/get-generation'

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

  const generationData = partData.generationsId
    ? await getGeneration(partData.generationsId)
    : null
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
      <div className={'member-data-grid gap-2'}>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Generation</div>
          <div className={'member-data-context'}>{generationData?.name}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Description</div>
          <div className={'member-data-context'}>{partData.description}</div>
        </div>
        <div className={'col-span-4'}>
          <div className={'member-data-title'}>Members</div>
          <div className={'member-data-grid'}>
            {partData.usersToParts.map((user) => (
              <div key={user.user.id} className={'member-data-box'}>
                <div className={'member-data-context'}>
                  {formatUserName(
                    user.user.name,
                    user.user.firstName,
                    user.user.lastName,
                    user.user.isForeigner
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminDefaultLayout>
  )
}
