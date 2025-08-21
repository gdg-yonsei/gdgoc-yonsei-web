import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { getSession } from '@/lib/server/fetcher/admin/get-session'
import { notFound } from 'next/navigation'
import DataForm from '@/app/components/data-form'
import SubmitButton from '@/app/components/admin/submit-button'
import { registerSessionAction } from '@/app/(admin)/admin/sessions/[sessionId]/register/actions'

export default async function RegisterSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params

  const sessionData = await getSession(sessionId)

  if (!sessionData) {
    notFound()
  }

  const maxCapacity = sessionData.maxCapacity ? sessionData.maxCapacity : 0
  const leftSeats = maxCapacity - sessionData.userToSession.length

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/sessions'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>Sessions</p>
      </AdminNavigationButton>
      <div className={'flex items-center gap-2'}>
        <div className={'admin-title'}>Session Registration</div>
      </div>
      <div>
        <div>남은 자리: {leftSeats}</div>
        <DataForm action={registerSessionAction}>
          <SubmitButton />
        </DataForm>
      </div>
    </AdminDefaultLayout>
  )
}
