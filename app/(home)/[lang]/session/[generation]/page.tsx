import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import formatDateYYYYMMDD from '@/lib/format-date-yyyy-mm-dd'
import db from '@/db'
import { eq } from 'drizzle-orm'
import { generations } from '@/db/schema/generations'

export const metadata: Metadata = {
  title: 'Sessions',
  description:
    'Discover innovative projects by GDGoC Yonsei, where developers collaborate to build impactful solutions using cutting-edge technologies. Explore our work and get inspired!',
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ lang: string; generation: string }>
}) {
  const paramsData = await params

  const generationData = await db.query.generations.findFirst({
    where: eq(generations.name, paramsData.generation),
    with: {
      parts: {
        with: {
          sessions: true,
        },
      },
    },
  })

  return (
    <div
      className={
        'mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 p-4 lg:grid-cols-2'
      }
    >
      {generationData?.parts
        .map((part) => part.sessions)
        .flatMap((session) => session)
        .map((session, i) => (
          <Link
            href={`/${paramsData.lang}/session/${paramsData.generation}/${session.id}`}
            key={i}
            className={`flex rounded-xl bg-white`}
          >
            <Image
              src={session.mainImage}
              width={200}
              height={200}
              alt={
                paramsData.lang === 'ko'
                  ? session.nameKo
                    ? session.nameKo
                    : ''
                  : session.name
              }
              className={'aspect-5/4 w-1/2 rounded-l-xl object-cover'}
            />
            <div className={'flex w-1/2 flex-col justify-between p-2'}>
              <h2 className={'text-2xl font-semibold'}>
                {paramsData.lang === 'ko' ? session.nameKo : session.name}
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
