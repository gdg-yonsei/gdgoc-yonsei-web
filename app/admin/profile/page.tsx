import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import UserProfile from '@/app/admin/profile/user-profile'
import { Suspense } from 'react'
import RegisterPasskeyButton from '@/app/components/auth/register-passkey-button'
import Link from 'next/link'

export default function ProfilePage() {
  return (
    <AdminDefaultLayout className={'p-4 flex flex-col gap-2'}>
      <div className={'flex items-center gap-2'}>
        <div className={'admin-title'}>Profile</div>
        <Link
          href={'/admin/profile/edit'}
          className={
            'p-2 px-3 rounded-lg bg-neutral-900 text-white text-sm hover:bg-neutral-800 transition-all'
          }
        >
          Edit
        </Link>
      </div>
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
