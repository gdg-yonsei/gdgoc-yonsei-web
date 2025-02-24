import { getMembers } from '@/lib/fetcher/get-members'
import { getGenerations } from '@/lib/fetcher/get-generations'

export default async function MembersPage() {
  const membersData = await getMembers()
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
        <div className={'flex items-center gap-2 text-xl'}>
          {generationsData.map((generation, i) => (
            <button type={'button'} key={i} className={'p-2 rounded-xl ring-2'}>
              {generation.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
