import { getGenerations } from '@/lib/fetcher/get-generations'
import StageButtonGroup from '@/app/components/stage-button-group'
import PageTitle from '@/app/components/page-title'
import { getProjects } from '@/lib/fetcher/get-projects'
import ProjectsList from '@/app/(home)/projects/projects-list'

export default async function ProjectsPage() {
  const generationsData = await getGenerations()
  const projectsData = await getProjects()

  return (
    <div className={'w-full min-h-screen pt-20'}>
      <PageTitle>Projects</PageTitle>
      <StageButtonGroup generationsData={generationsData} />
      <ProjectsList projectsData={projectsData} />
    </div>
  )
}
