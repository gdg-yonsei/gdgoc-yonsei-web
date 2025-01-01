import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import MembersTable from '@/app/admin/members/members-table'

export default function MembersPage() {
  return (
    <AdminDefaultLayout className={'p-4'}>
      <div className={'admin-title'}>Members</div>
      <MembersTable />
    </AdminDefaultLayout>
  )
}
