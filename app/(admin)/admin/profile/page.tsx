import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import UserProfile from '@/app/(admin)/admin/profile/user-profile'
import { Suspense } from 'react'
import RegisterPasskeyButton from '@/app/components/auth/register-passkey-button'
import Link from 'next/link'
import { PencilSquareIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import UnsubscribeSessionNotiEmailPage from '@/app/(admin)/admin/profile/unsubscribe-session-noti-email'

export const metadata: Metadata = {
  title: 'Profile',
}

export default function ProfilePage() {
  return (
    <AdminDefaultLayout className={'flex flex-col gap-2 p-4'}>
      <div className={'flex items-center gap-2'}>
        <div className={'admin-title'}>Profile</div>
        <Link
          href={'/admin/profile/edit'}
          className={
            'flex items-center gap-2 rounded-full bg-neutral-900 p-2 px-4 text-white transition-all hover:bg-neutral-800'
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
                'mx-auto size-48 animate-pulse rounded-lg bg-neutral-200'
              }
            />
            {new Array(11).fill(0).map((_, i) => (
              <div
                key={i}
                className={
                  'h-20 w-full animate-pulse rounded-lg bg-neutral-200'
                }
              />
            ))}
          </div>
        }
      >
        <UserProfile />
      </Suspense>
      <RegisterPasskeyButton />
      <UnsubscribeSessionNotiEmailPage />
    </AdminDefaultLayout>
  )
}
