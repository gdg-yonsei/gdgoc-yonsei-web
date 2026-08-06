import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminPageHeader from '@/app/components/admin/page-header'
import { AdminTableSkeleton } from '@/app/components/admin/skeleton'
import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'
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

export const metadata: Metadata = {
  title: 'Projects',
}

export default async function ProjectsPage() {
  const [locale, session] = await Promise.all([getAdminLocale(), auth()])
  const t = getAdminMessages(locale)
  const userId = session?.user?.id
  const [canCreate, resolvedScope] = await Promise.all([
    handlePermission(userId, 'post', 'projects'),
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
        <ProjectsTable
          scope={resolvedScope?.scope ?? null}
          locale={locale}
          t={t}
        />
      </Suspense>
    </AdminDefaultLayout>
  )
}
