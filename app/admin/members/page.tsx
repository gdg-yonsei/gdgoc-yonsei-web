import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import PageTitle from '@/app/components/admin/page-title'

export default function MembersPage() {
  return (
    <AdminDefaultLayout className={'p-4'}>
      <PageTitle>Members</PageTitle>
    </AdminDefaultLayout>
  )
}
