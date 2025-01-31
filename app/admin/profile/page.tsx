import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import UserProfile from '@/app/admin/profile/user-profile'
import { Suspense } from 'react'
import RegisterPasskeyButton from '@/app/components/auth/register-passkey-button'
import Link from 'next/link'
import { PencilSquareIcon } from '@heroicons/react/24/outline'

export default function ProfilePage() {
  return (
    <AdminDefaultLayout className={'p-4 flex flex-col gap-2'}>
      <div className={'flex items-center gap-2'}>
        <div className={'admin-title'}>Profile</div>
        <Link
          href={'/admin/profile/edit'}
          className={
            'p-2 px-4 rounded-full bg-neutral-900 text-white flex gap-2 items-center hover:bg-neutral-800 transition-all'
          }
        >
          <PencilSquareIcon className={'size-5'} />
          <p>Edit</p>
        </Link>
      </div>
      <Suspense
        fallback={
          <div
            className={'w-full h-96 rounded-xl bg-neutral-200 animate-pulse'}
          />
        }
      >
        <UserProfile />
      </Suspense>
      <RegisterPasskeyButton />
    </AdminDefaultLayout>
  )
}
