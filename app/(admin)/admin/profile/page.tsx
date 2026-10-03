/**
 * 내 프로필 화면(`/admin/profile`): 프로필 정보, 알림 메일 설정, 패스키 등록.
 */
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import UserProfile from '@/app/(admin)/admin/profile/user-profile'
import { Suspense } from 'react'
import RegisterPasskeyButton from '@/app/components/auth/register-passkey-button'
import Link from 'next/link'
import { CpuChipIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import UnsubscribeSessionNotiEmailPage from '@/app/(admin)/admin/profile/unsubscribe-session-noti-email'
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'

/** 브라우저 탭 제목. */
export const metadata: Metadata = {
  title: 'Profile',
}

/** 프로필 정보는 Suspense로 스트리밍하고, 그동안 같은 배치의 스켈레톤을 보여 준다. */
export default async function ProfilePage() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)

  return (
    <AdminDefaultLayout>
      <div className={'flex flex-wrap items-center gap-2'}>
        <div className={'admin-title'}>{t.profile}</div>
        <Link
          href={localizeAdminHref('/admin/profile/edit', locale)}
          className={'admin-btn-primary'}
        >
          <PencilSquareIcon className={'size-5'} />
          <p>{t.edit}</p>
        </Link>
        <Link
          href={localizeAdminHref('/admin/profile/mcp', locale)}
          className={'admin-btn-secondary'}
        >
          <CpuChipIcon className={'size-5'} />
          <p>{t.mcpConnections}</p>
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
