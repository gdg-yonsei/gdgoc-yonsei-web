import { getSessions } from '@/lib/fetcher/admin/get-sessions'
import Link from 'next/link'
import Image from 'next/image'

export default async function SessionsTable() {
  const sessionsData = await getSessions()

  return (
    <div className={'member-data-grid w-full gap-2'}>
      {sessionsData.map((session) => (
        <Link
          href={`/admin/sessions/${session.id}`}
          key={session.id}
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
      ))}
    </div>
  )
}
