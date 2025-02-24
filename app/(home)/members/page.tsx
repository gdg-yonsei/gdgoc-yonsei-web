import { getMembers } from '@/lib/fetcher/get-members'

export default async function MembersPage() {
  const membersData = await getMembers()
  console.log(membersData)

  return (
    <div className={'min-h-screen w-full pt-20 p-4'}>
      <div>Members Page</div>
    </div>
  )
}
