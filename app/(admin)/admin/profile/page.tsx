import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import UserProfile from '@/app/(admin)/admin/profile/user-profile'
import { Suspense } from 'react'
import RegisterPasskeyButton from '@/app/components/auth/register-passkey-button'
import Link from 'next/link'
import { PencilSquareIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import UnsubscribeSessionNotiEmailPage from '@/app/(admin)/admin/profile/unsubscribe-session-noti-email'
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'

export const metadata: Metadata = {
  title: 'Profile',
}

export default async function ProfilePage() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)

  return (
    <AdminDefaultLayout>
      <div className={'flex items-center gap-2'}>
        <div className={'admin-title'}>{t.profile}</div>
        <Link
          href={localizeAdminHref('/admin/profile/edit', locale)}
          className={'admin-btn-primary'}
        >
          <PencilSquareIcon className={'size-5'} />
          <p>{t.edit}</p>
        </Link>
      </div>
      <Suspense
        fallback={
          <div className={'admin-form-grid gap-2 py-4'}>
            <div
              className={
                'bg-surface-sunken mx-auto size-48 animate-pulse rounded-lg'
              }
            />
            {new Array(11).fill(0).map((_, i) => (
              <div
                key={i}
                className={
                  'bg-surface-sunken h-20 w-full animate-pulse rounded-lg'
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
