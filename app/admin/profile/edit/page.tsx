import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'

export default function EditProfile() {
  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={`/admin/profile`}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>Profile</p>
      </AdminNavigationButton>
      <div className={'admin-title py-4'}>Edit Profile</div>
    </AdminDefaultLayout>
  )
}
