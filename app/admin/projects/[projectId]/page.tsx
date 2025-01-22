import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { getProject } from '@/lib/fetcher/get-project'
import { notFound } from 'next/navigation'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import DataEditLink from '@/app/components/admin/data-edit-link'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { auth } from '@/auth'
import { MDXRemote } from 'next-mdx-remote/rsc'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  // Project 데이터 가져오기
  const projectData = await getProject(projectId)
  // Project 데이터가 없으면 404 페이지 표시
  if (!projectData) {
    notFound()
  }
  const session = await auth()

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/projects'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>Projects</p>
      </AdminNavigationButton>
      <div className={'flex gap-2 items-center'}>
        <div className={'admin-title'}>{projectData.name}</div>
        <DataEditLink
          session={session}
          dataId={projectId}
          dataType={'projects'}
          href={`/admin/projects/${projectId}/edit`}
        />
      </div>
      <div className={'member-data-grid gap-2'}>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Name</div>
          <div className={'member-data-content'}>{projectData.name}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Description</div>
          <div className={'member-data-content'}>{projectData.description}</div>
        </div>
        <div className={'prose w-full col-span-4'}>
          <div className={'member-data-title'}>Content</div>
          <MDXRemote source={projectData.content} />
        </div>
      </div>
    </AdminDefaultLayout>
  )
}
