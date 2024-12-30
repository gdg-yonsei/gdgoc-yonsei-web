import { auth } from '@/auth'

/**
 * 사용자 정보 표시 패널
 * @constructor
 */
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
