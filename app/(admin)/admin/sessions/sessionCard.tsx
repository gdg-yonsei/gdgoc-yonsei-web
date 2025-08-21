import { getSessions } from '@/lib/server/fetcher/admin/get-sessions'
import Link from 'next/link'
import Image from 'next/image'

export default function SessionCard({
  session,
  register = false,
}: {
  session: Awaited<ReturnType<typeof getSessions>>[0]['parts'][0]['sessions'][0]
  register?: boolean
}) {
  return (
    <Link
      href={
        register
          ? `/admin/sessions/${session.id}/register`
          : `/admin/sessions/${session.id}`
      }
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
          {session.startAt
            ? new Intl.DateTimeFormat('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }).format(new Date(session.startAt))
            : 'TBD'}
        </div>
      </div>
    </Link>
  )
}
