import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { getSession } from '@/lib/server/fetcher/admin/get-session'
import { notFound } from 'next/navigation'
import DataForm from '@/app/components/data-form'
import SubmitButton from '@/app/components/admin/submit-button'
import { registerSessionAction } from '@/app/(admin)/admin/sessions/[sessionId]/register/actions'

const formatter = new Intl.DateTimeFormat('ko-KR', {
  year: '2-digit',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false, // 24시간제, true로 하면 오전/오후 붙음
})

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

  const registerSessionActionWithSessionId = registerSessionAction.bind(
    null,
    sessionId
  )

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/sessions'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>Sessions</p>
      </AdminNavigationButton>
      <div className={'flex items-center gap-2'}>
        <div className={'admin-title'}>Session Registration</div>
      </div>
      <div className={'grid w-full grid-cols-1 gap-2 md:grid-cols-2'}>
        <div className={'w-full rounded-xl bg-white p-2'}>
          <h2>Session Information</h2>
          <div className={'py-1'}>
            <p className={'text-sm text-neutral-700'}>Session</p>
            <p>EN: {sessionData.name}</p>
            <p>KO: {sessionData.nameKo}</p>
          </div>
          <div className={'py-1'}>
            <p className={'text-sm text-neutral-700'}>Description</p>
            <p>EN: {sessionData.description}</p>
            <p>KO: {sessionData.descriptionKo}</p>
          </div>
          <div className={'py-1'}>
            <p className={'text-sm text-neutral-700'}>Location</p>
            <p>EN: {sessionData.location}</p>
            <p>KO: {sessionData.locationKo}</p>
          </div>
          <div className={'py-1'}>
            <p className={'text-sm text-neutral-700'}>Schedule</p>
            <p>
              Start:{' '}
              {sessionData.startAt
                ? formatter.format(sessionData.startAt)
                : 'TBD'}
            </p>
            <p className={''}>
              End:{' '}
              {sessionData.endAt ? formatter.format(sessionData.endAt) : 'TBD'}
            </p>
          </div>
          <div className={'py-1'}>
            <p className={'text-sm text-neutral-700'}>Participants</p>
            <div
              className={
                'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }
            >
              {sessionData.userToSession.map((user) => (
                <p
                  key={user.userId}
                  className={
                    'rounded-lg bg-neutral-900 p-1 px-2 text-center text-white'
                  }
                >
                  {user.user.name}
                </p>
              ))}
            </div>
          </div>
        </div>
        <div
          className={
            'flex w-full flex-col items-center justify-center gap-2 rounded-xl bg-white p-2'
          }
        >
          <div className={'text-2xl'}>Remaining seats: {leftSeats}</div>
          <DataForm
            action={registerSessionActionWithSessionId}
            className={'w-full'}
          >
            <SubmitButton
              className={
                'flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 p-1 text-xl text-white'
              }
            >
              Register
            </SubmitButton>
          </DataForm>
        </div>
      </div>
    </AdminDefaultLayout>
  )
}
