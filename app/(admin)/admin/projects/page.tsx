import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { auth } from '@/auth'
import handlePermission from '@/lib/admin/handle-permission'
import React, { Suspense } from 'react'
import { PlusCircleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import ProjectsTable from '@/app/(admin)/admin/projects/projects-table'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Projects',
}

export default async function ProjectsPage() {
  const session = await auth()
  // 사용자가 파타를 생성할 권한이 있는지 확인
  const canCreate = await handlePermission(
    session?.user?.id,
    'post',
    'projects'
  )

  return (
    <AdminDefaultLayout className={'p-4'}>
      <div className={'flex items-center gap-2 pb-2'}>
        <div className={'admin-title'}>Projects</div>
        {canCreate && (
          <Link
            href={'/admin/projects/create'}
            className={
              'flex items-center gap-1 p-2 px-3 rounded-xl bg-neutral-900 text-white text-sm hover:bg-neutral-800 transition-all'
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
            className={'w-full h-28 rounded-xl bg-neutral-200 animate-pulse'}
          />
        }
      >
        <ProjectsTable />
      </Suspense>
    </AdminDefaultLayout>
  )
}
