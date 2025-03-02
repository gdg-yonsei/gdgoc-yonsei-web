import { getProject } from '@/lib/fetcher/get-project'
import { notFound } from 'next/navigation'
import PageTitle from '@/app/components/page-title'
import ImagesSliders from '@/app/(home)/projects/[projectId]/images-slider'
import formatUserName from '@/lib/format-user-name'
import { MDXRemote } from 'next-mdx-remote/rsc'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const projectData = await getProject(projectId)

  if (!projectData) {
    return notFound()
  }

  return (
    <div className={'w-full min-h-screen pt-20'}>
      <PageTitle>{projectData.name}</PageTitle>
      <ImagesSliders images={[projectData.mainImage, ...projectData.images]} />
      <div className={'gap-8 flex flex-col'}>
        <div>
          <h2
            className={
              'text-xl font-semibold border-b-2 px-4 border-neutral-400'
            }
          >
            Contributor
          </h2>
          <div className={'px-4'}>
            {projectData.usersToProjects.map((user, i) => (
              <div key={i} className={'flex gap-1 items-center'}>
                <div>
                  {formatUserName(
                    user.user.name,
                    user.user.firstName,
                    user.user.lastName,
                    user.user.isForeigner
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2
            className={
              'text-xl font-semibold border-b-2 px-4 border-neutral-400'
            }
          >
            About This Project
          </h2>
          <div className={'prose px-4'}>
            <MDXRemote source={projectData.content} />
          </div>
        </div>
      </div>
    </div>
  )
}
