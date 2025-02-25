import { getGenerations } from '@/lib/fetcher/get-generations'
import StageButtonGroup from '@/app/components/stage-button-group'
import PageTitle from '@/app/components/page-title'

export default async function ProjectsPage() {
  const generationsData = await getGenerations()

  return (
    <div className={'w-full min-h-screen pt-20'}>
      <PageTitle>Projects</PageTitle>
      <StageButtonGroup generationsData={generationsData} />
    </div>
  )
}
