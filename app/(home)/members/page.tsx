import { getGenerations } from '@/lib/fetcher/get-generations'
import GenerationButtonGroup from '@/app/(home)/members/generation-button-group'
import MembersList from '@/app/(home)/members/members-list'

export default async function MembersPage() {
  const generationsData = await getGenerations()

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <h1
        className={'text-3xl font-bold px-4 border-b-2 border-neutral-900 pb-2'}
      >
        Members
      </h1>
      <div className={'flex items-center justify-between p-4'}>
        <p className={'text-2xl font-semibold'}>Stage</p>
        <GenerationButtonGroup
          generations={generationsData.map((data) => data.name)}
        />
      </div>
      <MembersList generationData={generationsData} />
    </div>
  )
}
