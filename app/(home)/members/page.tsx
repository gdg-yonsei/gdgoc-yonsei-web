import { getGenerations } from '@/lib/fetcher/get-generations'
import MembersList from '@/app/(home)/members/members-list'
import StageButtonGroup from '@/app/components/stage-button-group'
import PageTitle from '@/app/components/page-title'

export default async function MembersPage() {
  const generationsData = await getGenerations()

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <PageTitle>Members</PageTitle>
      <StageButtonGroup generationsData={generationsData} />
      <MembersList generationData={generationsData} />
    </div>
  )
}
