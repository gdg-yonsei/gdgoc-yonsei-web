import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import handlePermission from '@/lib/admin/handle-permission'
import { auth } from '@/auth'
import { forbidden } from 'next/navigation'

export default async function MembersPage() {
  const session = await auth()
  if (!(await handlePermission(session?.user?.id, 'get', 'membersPage'))) {
    forbidden()
  }

  return (
    <AdminDefaultLayout className={'p-4'}>
      <div className={'admin-title'}>Members</div>
    </AdminDefaultLayout>
  )
}
