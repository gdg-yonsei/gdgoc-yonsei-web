import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import UserProfile from '@/app/(admin)/admin/profile/user-profile'
import { Suspense } from 'react'
import RegisterPasskeyButton from '@/app/components/auth/register-passkey-button'
import Link from 'next/link'
import { PencilSquareIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profile',
}

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
          <div className={'member-data-grid gap-2 py-4'}>
            <div
              className={
                'size-48 mx-auto rounded-lg bg-neutral-200 animate-pulse'
              }
            />
            {new Array(11).fill(0).map((_, i) => (
              <div
                key={i}
                className={
                  'w-full h-20 rounded-lg bg-neutral-200 animate-pulse'
                }
              />
            ))}
          </div>
        }
      >
        <UserProfile />
      </Suspense>
      <RegisterPasskeyButton />
    </AdminDefaultLayout>
  )
}
