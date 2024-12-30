import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import UserProfile from '@/app/admin/profile/user-profile'
import { Suspense } from 'react'
import RegisterPasskeyButton from '@/app/components/auth/register-passkey-button'

export default function ProfilePage() {
  return (
    <AdminDefaultLayout className={'p-4 flex flex-col gap-2'}>
      <div className={'admin-title'}>Profile</div>
      <Suspense
        fallback={
          <p className={'p-2 rounded-lg bg-white shadow-xl text-center'}>
            Loading...
          </p>
        }
      >
        <UserProfile />
      </Suspense>
      <RegisterPasskeyButton />
    </AdminDefaultLayout>
  )
}
