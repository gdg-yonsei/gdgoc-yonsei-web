import { getSessions } from '@/lib/fetcher/admin/get-sessions'
import Link from 'next/link'
import Image from 'next/image'

function SessionCard({
  session,
}: {
  session: Awaited<ReturnType<typeof getSessions>>[0]['sessions'][0]
}) {
  return (
    <Link
      href={`/admin/sessions/${session.id}`}
      className={'rounded-xl bg-white flex flex-col '}
    >
      <Image
        src={session.mainImage}
        alt={'Main Image'}
        width={600}
        height={400}
        className={'object-cover rounded-t-xl aspect-3/2 w-full'}
        placeholder={'blur'}
        blurDataURL={'/default-image.png'}
      />

      <div className={'p-4'}>
        <div className={'text-xl font-semibold pb-2'}>{session.name}</div>
        <div className={'flex text-sm flex-col'}>
          <div>
            {new Intl.DateTimeFormat('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }).format(new Date(session.eventDate))}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default async function SessionsTable() {
  const sessionsData = await getSessions()

  return (
    <div className={'w-full flex flex-col gap-2'}>
      {sessionsData.map((generation) => (
        <div key={generation.id}>
          <div
            className={'border-b-2 text-sm text-neutral-600 border-neutral-300'}
          >
            Generation: {generation.name}
          </div>
          <div className={'member-data-grid w-full gap-2 pt-2'}>
            {generation.sessions.map((session) => (
              <SessionCard session={session} key={session.id} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
