import { getSessions } from '@/lib/server/fetcher/admin/get-sessions'
import SessionCard from '@/app/(admin)/admin/sessions/sessionCard'

export default async function SessionsTable() {
  const sessionsData = await getSessions()

  return (
    <div className={'flex w-full flex-col gap-2'}>
      {sessionsData?.map((generation) => (
        <div key={generation.id}>
          <div
            className={'border-b-2 border-neutral-300 text-sm text-neutral-600'}
          >
            Generation: {generation.name}
          </div>
          <div className={'member-data-grid w-full gap-2 pt-2'}>
            {generation?.parts?.map((part) =>
              part.sessions.map((session) => (
                <SessionCard session={session} key={session.id} />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
