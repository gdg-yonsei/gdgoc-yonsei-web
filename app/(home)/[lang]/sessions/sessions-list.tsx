'use client'

import { getSessions } from '@/lib/fetcher/get-sessions'
import { useAtom } from 'jotai'
import { generationState } from '@/lib/atoms'
import Link from 'next/link'
import Image from 'next/image'
import formatDateYYYYMMDD from '@/lib/format-date-yyyy-mm-dd'

export default function SessionsList({
  sessionsData,
}: {
  sessionsData: Awaited<ReturnType<typeof getSessions>>
}) {
  const [generation] = useAtom(generationState)
  const sortedSessions = sessionsData.filter(
    (session) => session.generation.name === generation
  )

  return (
    <div
      className={
        'mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 p-4 lg:grid-cols-2'
      }
    >
      {sortedSessions.map((session, i) => (
        <Link
          href={`/sessions/${session.id}`}
          key={i}
          className={`flex rounded-xl bg-white shadow-xl`}
        >
          <Image
            src={session.mainImage}
            width={200}
            height={200}
            alt={session.name}
            className={'aspect-5/4 w-2/3 rounded-l-xl object-cover'}
          />
          <div className={'flex w-1/3 flex-col justify-between p-2'}>
            <h2 className={'text-2xl font-semibold'}>{session.name}</h2>
            <p className={'ml-auto'}>
              {formatDateYYYYMMDD(new Date(session.updatedAt))}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
