import { getSessions } from '@/lib/server/fetcher/admin/get-sessions'
import Link from 'next/link'
import Image from 'next/image'

function SessionCard({
  session,
}: {
  session: Awaited<ReturnType<typeof getSessions>>[0]['parts'][0]['sessions'][0]
}) {
  return (
    <Link
      href={`/admin/sessions/${session.id}`}
      className={'flex flex-col rounded-xl bg-white'}
    >
      <Image
        src={session.mainImage}
        alt={'Main Image'}
        width={600}
        height={400}
        className={'aspect-3/2 w-full rounded-t-xl object-cover'}
        placeholder={'blur'}
        blurDataURL={'/default-image.png'}
      />
      <div
        className={'flex h-full flex-col items-start justify-between p-2 px-4'}
      >
        <div>
          <div className={'text-xl font-semibold'}>{session.name}</div>
          <div className={'pb-2 text-xl font-semibold'}>{session.nameKo}</div>
        </div>
        <div className={'flex flex-col text-sm'}>
          {new Intl.DateTimeFormat('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }).format(new Date(session.eventDate))}
        </div>
      </div>
    </Link>
  )
}

export default async function SessionsTable() {
  const sessionsData = await getSessions()

  console.log(sessionsData)

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
