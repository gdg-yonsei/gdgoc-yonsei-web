import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminPageHeader from '@/app/components/admin/page-header'
import { AdminTableSkeleton } from '@/app/components/admin/skeleton'
import { Suspense } from 'react'
import PartsTable from '@/app/(admin)/admin/parts/parts-table'
import handlePermission from '@/lib/server/permission/handle-permission'
import Link from 'next/link'
import { auth } from '@/auth'
import { PlusCircleIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'

export const metadata: Metadata = {
  title: 'Parts',
}

/**
 * `PartsPage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
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
export default async function PartsPage() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const session = await auth()
  // 사용자가 파타를 생성할 권한이 있는지 확인
  const canCreate = await handlePermission(session?.user?.id, 'post', 'parts')
  const resolvedScope = session?.user?.id
    ? await resolveAdminGenerationScope(session.user.id)
    : null
  const canCreateInCurrentScope =
    canCreate && resolvedScope?.scope?.kind === 'generation'

  return (
    <AdminDefaultLayout>
      <AdminPageHeader
        title={t.parts}
        actions={
          <>
            {canCreateInCurrentScope && (
              <Link
                href={localizeAdminHref('/admin/parts/create', locale)}
                className={'admin-btn-primary'}
              >
                <PlusCircleIcon className={'size-5'} aria-hidden={'true'} />
                {t.create}
              </Link>
            )}
            {canCreate && !canCreateInCurrentScope && (
              <p className={'admin-badge-warning py-1.5'}>
                {t.selectSpecificGenerationToCreate}
              </p>
            )}
          </>
        }
      />

      <Suspense fallback={<AdminTableSkeleton />}>
        <PartsTable scope={resolvedScope?.scope ?? null} />
      </Suspense>
    </AdminDefaultLayout>
  )
}
