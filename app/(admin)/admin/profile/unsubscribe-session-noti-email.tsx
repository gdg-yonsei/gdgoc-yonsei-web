import { auth } from '@/auth'
import { notFound } from 'next/navigation'
import { getMember } from '@/lib/server/fetcher/admin/get-member'
import { changeSubscribeSessionNotiEmail } from '@/app/(admin)/admin/profile/actions'

export default async function UnsubscribeSessionNotiEmailPage() {
  const session = await auth()

  if (!session?.user?.id) {
    notFound()
  }

  const userData = await getMember(session.user.id)

  return (
    <form
      className={'flex w-full items-center justify-center'}
      action={changeSubscribeSessionNotiEmail}
    >
      <button
        className={`rounded-full border-2 ${userData.sessionNotiEmail ? 'border-red-500 bg-red-50 text-red-800 hover:bg-red-200' : 'border-green-500 bg-green-50 text-green-800 hover:bg-green-200'} p-2 px-4 text-sm transition-colors`}
      >
        {userData.sessionNotiEmail ? 'Unsubscribe' : 'Subscribe'} Session
        Notification Emails
      </button>
    </form>
  )
}
