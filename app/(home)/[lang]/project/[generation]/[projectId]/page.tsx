import { getProject } from '@/lib/server/fetcher/get-project'
import { notFound } from 'next/navigation'
import PageTitle from '@/app/components/page-title'
import ImagesSliders from '@/app/components/images-slider'
import formatUserName from '@/lib/format-user-name'
import SafeMDX from '@/app/components/safe-mdx'
import NavigationButton from '@/app/components/navigation-button'
import { getProjects } from '@/lib/server/fetcher/get-projects'
import { Metadata } from 'next'

export async function generateStaticParams() {
  const projectsData = await getProjects()
  return projectsData.map((project) => ({ projectId: project.id }))
}

type Props = {
  params: Promise<{ projectId: string; lang: string; generation: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, generation, projectId } = await params

  const projectData = await getProject(projectId)

  if (!projectData) {
    if (lang === 'ko') {
      return {
        title: `${generation} 프로젝트`,
        description: `GDGoC Yonsei ${generation} 프로젝트`,
      }
    } else {
      return {
        title: `${generation} Projects`,
        description: `GDGoC Yonsei ${generation} Projects`,
      }
    }
  }

  if (lang === 'ko') {
    return {
      title: `${projectData.nameKo}`,
      description: `${projectData.descriptionKo}`,
    }
  }

  return {
    title: `${projectData.name}`,
    description: `${projectData.description}`,
  }
}

export default async function ProjectPage({ params }: Props) {
  const { projectId, lang, generation } = await params
  const projectData = await getProject(projectId)

  if (!projectData) {
    return notFound()
  }

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <NavigationButton href={`/${lang}/project/${generation}`}>
        <p>Projects</p>
      </NavigationButton>
      <PageTitle>
        {lang === 'ko' ? projectData.nameKo : projectData.name}
      </PageTitle>
      <ImagesSliders images={[projectData.mainImage, ...projectData.images]} />
      <div className={'flex flex-col gap-8 py-8'}>
        <div className={'flex flex-col'}>
          <div className={'border-gdg-white flex w-full border-b-2'}>
            <h2
              className={'mx-auto w-full max-w-4xl px-4 text-xl font-semibold'}
            >
              {lang === 'ko' ? '프로젝트 참여자' : 'Project Contributors'}
            </h2>
          </div>
          <div className={'mx-auto w-full max-w-4xl px-4'}>
            {projectData.usersToProjects.map((user, i) => (
              <div key={i} className={'flex items-center gap-1'}>
                <div>
                  {lang === 'ko'
                    ? formatUserName(
                        user.user.name,
                        user.user.firstNameKo,
                        user.user.lastNameKo,
                        user.user.isForeigner,
                        true
                      )
                    : formatUserName(
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
              {lang === 'ko' ? '프로젝트 설명' : 'Project Content'}
            </h2>
          </div>
          <div className={'prose mx-auto w-full max-w-4xl p-4'}>
            <SafeMDX
              source={
                lang === 'ko' ? projectData.contentKo : projectData.content
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
