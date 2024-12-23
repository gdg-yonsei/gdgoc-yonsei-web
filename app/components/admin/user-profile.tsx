import { auth } from '@/auth'

export default async function UserProfile() {
  const session = await auth()

  return (
    <div
      className={'bg-white p-4 rounded-xl shadow-xl flex flex-col items-center'}
    >
      <div>{session?.user?.name}</div>
      <div>{session?.user?.email}</div>
    </div>
  )
}
