'use client'

import { getSessions } from '@/lib/server/fetcher/get-sessions'
import { useAtom } from 'jotai'
import { generationState } from '@/lib/atoms'
import Link from 'next/link'
import Image from 'next/image'
import formatDateYYYYMMDD from '@/lib/format-date-yyyy-mm-dd'

export default function SessionsList({
  sessionsData,
  lang,
}: {
  sessionsData: Awaited<ReturnType<typeof getSessions>>
  lang: string
}) {
  const [generation] = useAtom(generationState)
  const sortedSessions = sessionsData.filter(
    (session) => session.part.generation?.name === generation
  )

  return (
    <div
      className={
        'mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 p-4 lg:grid-cols-2'
      }
    >
      {sortedSessions.map((session, i) => (
        <Link
          href={`/session/${session.id}`}
          key={i}
          className={`flex rounded-xl bg-white`}
        >
          <Image
            src={session.mainImage}
            width={200}
            height={200}
            alt={
              lang === 'ko'
                ? session.nameKo
                  ? session.nameKo
                  : ''
                : session.name
            }
            className={'aspect-5/4 w-1/2 rounded-l-xl object-cover'}
          />
          <div className={'flex w-1/2 flex-col justify-between p-2'}>
            <h2 className={'text-2xl font-semibold'}>
              {lang === 'ko' ? session.nameKo : session.name}
            </h2>
            <p className={'ml-auto'}>
              {formatDateYYYYMMDD(new Date(session.updatedAt))}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
