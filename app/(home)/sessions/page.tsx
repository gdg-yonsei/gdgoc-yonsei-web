import PageTitle from '@/app/components/page-title'
import StageButtonGroup from '@/app/components/stage-button-group'
import { getGenerations } from '@/lib/fetcher/get-generations'
import SessionsList from '@/app/(home)/sessions/sessions-list'
import { getSessions } from '@/lib/fetcher/get-sessions'

export default async function SessionsPage() {
  const generationsData = await getGenerations()
  const sessionsData = await getSessions()

  return (
    <div className={'w-full min-h-screen pt-20'}>
      <PageTitle>Sessions</PageTitle>
      <StageButtonGroup generationsData={generationsData} />
      <SessionsList sessionsData={sessionsData} />
    </div>
  )
}
