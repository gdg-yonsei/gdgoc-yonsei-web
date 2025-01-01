import { getMember } from '@/lib/fetcher/get-member'
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import formatUserName from '@/lib/format-user-name'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'

export default async function MemberPage({
  params,
}: {
  params: Promise<{ memberId: string }>
}) {
  const { memberId } = await params

  const memberData = await getMember(memberId)

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/members'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>Members</p>
      </AdminNavigationButton>
      <div className={'admin-title'}>
        {formatUserName(
          memberData.name,
          memberData.firstName,
          memberData.lastName,
          memberData.isForeigner
        )}
      </div>
    </AdminDefaultLayout>
  )
}
