import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'
import Link from 'next/link'
import { PlusCircleIcon } from '@heroicons/react/24/outline'
import SessionsTable from '@/app/(admin)/admin/sessions/sessionsTable'
import { Suspense } from 'react'
import { Metadata } from 'next'
import UpcomingSessions from '@/app/(admin)/admin/sessions/upcomingSessions'
import RegisterSession from '@/app/(admin)/admin/sessions/registerSession'

export const metadata: Metadata = {
  title: 'Sessions',
}

/**
 * `SessionsPage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
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
export default async function SessionsPage() {
  const session = await auth()
  // 사용자가 Session 을 생성할 권한이 있는지 확인
  const canCreate = await handlePermission(
    session?.user?.id,
    'post',
    'sessions'
  )

  return (
    <AdminDefaultLayout className={'flex flex-col gap-2 p-4'}>
      <Suspense
        fallback={
          <div
            className={'h-28 w-full animate-pulse rounded-xl bg-neutral-200'}
          />
        }
      >
        <UpcomingSessions />
      </Suspense>
      <Suspense
        fallback={
          <div
            className={'h-28 w-full animate-pulse rounded-xl bg-neutral-200'}
          />
        }
      >
        <RegisterSession />
      </Suspense>
      <div className={'flex items-center gap-2 pb-2'}>
        <div className={'admin-title'}>Sessions</div>
        {canCreate && (
          <Link
            href={'/admin/sessions/create'}
            className={
              'flex items-center gap-1 rounded-xl bg-neutral-900 p-2 px-3 text-sm text-white transition-all hover:bg-neutral-800'
            }
          >
            <PlusCircleIcon className={'size-5'} />
            <p>Create</p>
          </Link>
        )}
      </div>
      <Suspense
        fallback={
          <div
            className={'h-28 w-full animate-pulse rounded-xl bg-neutral-200'}
          />
        }
      >
        <SessionsTable />
      </Suspense>
    </AdminDefaultLayout>
  )
}
