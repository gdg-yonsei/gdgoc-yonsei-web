import { getProject } from '@/lib/fetcher/get-project'
import { notFound } from 'next/navigation'
import PageTitle from '@/app/components/page-title'
import ImagesSliders from '@/app/components/images-slider'
import formatUserName from '@/lib/format-user-name'
import SafeMDX from '@/app/components/safe-mdx'
import NavigationButton from '@/app/components/navigation-button'

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
    <div className={'min-h-screen w-full pt-20'}>
      <NavigationButton href={'/projects'}>
        <p>Projects</p>
      </NavigationButton>
      <PageTitle>{projectData.name}</PageTitle>
      <ImagesSliders images={[projectData.mainImage, ...projectData.images]} />
      <div className={'flex flex-col gap-8 py-8'}>
        <div className={'flex flex-col'}>
          <div className={'border-gdg-white flex w-full border-b-2'}>
            <h2
              className={'mx-auto w-full max-w-4xl px-4 text-xl font-semibold'}
            >
              Contributor
            </h2>
          </div>
          <div className={'mx-auto w-full max-w-4xl px-4'}>
            {projectData.usersToProjects.map((user, i) => (
              <div key={i} className={'flex items-center gap-1'}>
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
        <div className={'flex flex-col'}>
          <div className={'border-gdg-white flex w-full border-b-2'}>
            <h2
              className={'mx-auto w-full max-w-4xl px-4 text-xl font-semibold'}
            >
              About This Project
            </h2>
          </div>
          <div className={'prose mx-auto w-full max-w-4xl p-4'}>
            <SafeMDX source={projectData.content} />
          </div>
        </div>
      </div>
    </div>
  )
}
