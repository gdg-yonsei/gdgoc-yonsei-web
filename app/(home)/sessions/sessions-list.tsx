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
    <div className={'w-full grid grid-cols-2 gap-2 p-4'}>
      {sortedSessions.map((session, i) => (
        <Link
          href={`/sessions/${session.id}`}
          key={i}
          className={`bg-white rounded-2xl flex flex-col items-center justify-center p-2 ring-2 ${i % 4 === 0 && 'ring-red-500'} ${i % 4 === 1 && 'ring-yellow-500'} ${i % 4 === 0 && 'ring-green-600'} ${i % 4 === 3 && 'ring-blue-500'}`}
        >
          <h2 className={'text-xl font-semibold p-2'}>{session.name}</h2>
          <Image
            src={session.mainImage}
            width={200}
            height={200}
            alt={session.name}
            className={'w-full aspect-square object-cover'}
          />
          <p className={'text-lg font-semibold'}>
            {formatDateYYYYMMDD(new Date(session.updatedAt))}
          </p>
        </Link>
      ))}
    </div>
  )
}
