import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import UserProfile from '@/app/components/admin/user-profile'
import { Suspense } from 'react'
import PageTitle from '@/app/components/admin/page-title'
import RegisterPasskeyButton from '@/app/components/auth/register-passkey-button'

export default function ProfilePage() {
  return (
    <AdminDefaultLayout className={'p-4 flex flex-col gap-2'}>
      <PageTitle>Profile</PageTitle>
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
