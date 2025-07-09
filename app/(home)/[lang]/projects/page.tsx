import { getGenerations } from '@/lib/fetcher/get-generations'
import StageButtonGroup from '@/app/components/stage-button-group'
import PageTitle from '@/app/components/page-title'
import { getProjects } from '@/lib/fetcher/get-projects'
import ProjectsList from '@/app/(home)/[lang]/projects/projects-list'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Projects',
  description:
    'Discover innovative projects by GDGoC Yonsei, where developers collaborate to build impactful solutions using cutting-edge technologies. Explore our work and get inspired!',
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const generationsData = await getGenerations()
  const projectsData = await getProjects()
  const { lang } = await params

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <PageTitle>Projects</PageTitle>
      <StageButtonGroup generationsData={generationsData} />
      <ProjectsList lang={lang} projectsData={projectsData} />
    </div>
  )
}
