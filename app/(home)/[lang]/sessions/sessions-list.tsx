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
        'mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      }
    >
      {sortedSessions.map((session, i) => (
        <Link
          href={`/sessions/${session.id}`}
          key={i}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 bg-white p-2 ${i % 4 === 0 && 'border-red-500'} ${i % 4 === 1 && 'border-yellow-500'} ${i % 4 === 2 && 'border-green-600'} ${i % 4 === 3 && 'border-blue-500'}`}
        >
          <h2 className={'p-2 text-xl font-semibold'}>{session.name}</h2>
          <Image
            src={session.mainImage}
            width={200}
            height={200}
            alt={session.name}
            className={'aspect-square w-full object-cover'}
          />
          <p className={'text-lg font-semibold'}>
            {formatDateYYYYMMDD(new Date(session.updatedAt))}
          </p>
        </Link>
      ))}
    </div>
  )
}
