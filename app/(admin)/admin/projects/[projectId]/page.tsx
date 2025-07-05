import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { getProject } from '@/lib/fetcher/admin/get-project'
import { notFound } from 'next/navigation'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import DataEditLink from '@/app/components/admin/data-edit-link'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { auth } from '@/auth'
import SafeMDX from '@/app/components/safe-mdx'
import Image from 'next/image'
import formatUserName from '@/lib/format-user-name'
import DataDeleteButton from '@/app/components/admin/data-delete-button'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  // Project 데이터 가져오기
  const projectData = await getProject(projectId)

  return {
    title: `Project: ${projectData?.name}`,
  }
}

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
      <div className={'flex items-center gap-2'}>
        <div className={'admin-title'}>{projectData.name}</div>
        <DataEditLink
          session={session}
          dataId={projectId}
          dataType={'projects'}
          href={`/admin/projects/${projectId}/edit`}
        />
        <DataDeleteButton
          session={session}
          dataType={'projects'}
          dataId={projectId}
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
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Generation</div>
          <div className={'member-data-content'}>
            {projectData.generation?.name}
          </div>
        </div>
        <div className={'member-data-col-span'}>
          <div className={'member-data-title'}>Participants</div>
          <div className={'member-data-grid gap-2'}>
            {projectData.usersToProjects.map((user) => (
              <div key={user.user.id} className={'member-data-box'}>
                {formatUserName(
                  user.user.name,
                  user.user.firstName,
                  user.user.lastName,
                  user.user.isForeigner
                )}
              </div>
            ))}
          </div>
        </div>
        <div
          className={
            'member-data-col-span grid grid-cols-1 gap-2 sm:grid-cols-2'
          }
        >
          <div className={'mx-auto flex w-full max-w-lg flex-col gap-2'}>
            <div className={'member-data-title'}>Main Image</div>
            <Image
              src={projectData.mainImage}
              alt={projectData.mainImage}
              width={600}
              height={400}
              className={'w-full'}
              placeholder={'blur'}
              blurDataURL={'/default-image.png'}
            />
          </div>
          <div className={'mx-auto flex w-full max-w-lg flex-col gap-2'}>
            <div className={'member-data-title'}>Content Images</div>
            {projectData.images.map((image, index) => (
              <Image
                key={index}
                src={image}
                alt={image}
                width={600}
                height={400}
                className={'w-full'}
                placeholder={'blur'}
                blurDataURL={'/default-image.png'}
              />
            ))}
          </div>
        </div>
        <div className={'prose member-data-col-span w-full py-8'}>
          <div className={'member-data-title'}>Content</div>
          <SafeMDX source={projectData.content} />
        </div>
      </div>
    </AdminDefaultLayout>
  )
}
