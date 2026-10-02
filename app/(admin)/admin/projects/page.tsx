/**
 * 프로젝트 목록 화면(`/admin/projects`). 생성 권한이 있으면 "만들기" 버튼을 보인다.
 */
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminPageHeader from '@/app/components/admin/page-header'
import { AdminTableSkeleton } from '@/app/components/admin/skeleton'
import { getAuthSession } from '@/auth'
import { hasPermission } from '@/lib/server/permission/has-permission'
import { Suspense } from 'react'
import { PlusCircleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import ProjectsTable from '@/app/(admin)/admin/projects/projects-table'
import { Metadata } from 'next'
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'

/** 브라우저 탭 제목. */
export const metadata: Metadata = {
  title: 'Projects',
}

/** 프로젝트 목록. 표는 Suspense로 스트리밍하고 그동안 스켈레톤을 보여 준다. */
export default async function ProjectsPage() {
  const [locale, session] = await Promise.all([
    getAdminLocale(),
    getAuthSession(),
  ])
  const t = getAdminMessages(locale)
  const userId = session?.user?.id
  const [canCreate, resolvedScope] = await Promise.all([
    hasPermission(userId, 'post', 'projects'),
    userId ? resolveAdminGenerationScope(userId) : Promise.resolve(null),
  ])
  const canCreateInCurrentScope =
    canCreate && resolvedScope?.scope?.kind === 'generation'

  return (
    <AdminDefaultLayout>
      <AdminPageHeader
        title={t.projects}
        actions={
          <>
            {canCreateInCurrentScope && (
              <Link
                href={localizeAdminHref('/admin/projects/create', locale)}
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
        <ProjectsTable scope={resolvedScope?.scope ?? null} />
      </Suspense>
    </AdminDefaultLayout>
  )
}
