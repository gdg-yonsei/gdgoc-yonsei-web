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

/**
 * `ProfilePage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
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
