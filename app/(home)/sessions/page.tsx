import PageTitle from '@/app/components/page-title'
import StageButtonGroup from '@/app/components/stage-button-group'
import { getGenerations } from '@/lib/fetcher/get-generations'

export default async function SessionsPage() {
  const generationsData = await getGenerations()

  return (
    <div className={'w-full min-h-screen pt-16'}>
      <PageTitle>Sessions</PageTitle>
      <StageButtonGroup generationsData={generationsData} />
    </div>
  )
}
