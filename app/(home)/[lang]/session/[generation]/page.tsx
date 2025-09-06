import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import db from '@/db'
import { eq, lte } from 'drizzle-orm'
import { generations } from '@/db/schema/generations'
import PageTitle from '@/app/components/page-title'
import StageButtonGroup from '@/app/components/stage-button-group'
import getGenerationList from '@/lib/server/fetcher/getGenerationList'
import { sessions } from '@/db/schema/sessions'
import cacheTag from '@/lib/server/cacheTag'

export const metadata: Metadata = {
  title: 'Sessions',
  description:
    'Discover innovative projects by GDGoC Yonsei, where developers collaborate to build impactful solutions using cutting-edge technologies. Explore our work and get inspired!',
}

export async function generateStaticParams() {
  const generationList = await getGenerationList()
  return generationList.map((generation) => ({ generation: generation.name }))
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ lang: string; generation: string }>
}) {
  'use cache'
  cacheTag('sessions', 'generations')
  const paramsData = await params

  const generationData = await db.query.generations.findFirst({
    where: eq(generations.name, paramsData.generation),
    with: {
      parts: {
        with: {
          sessions: {
            where: lte(sessions.endAt, new Date()),
          },
        },
      },
    },
  })

  const sessionList = generationData?.parts
    .map((part) => part.sessions)
    .flatMap((session) => session)

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <PageTitle>{paramsData.lang === 'ko' ? '세션' : 'Sessions'}</PageTitle>
      <StageButtonGroup
        basePath={'session'}
        generation={paramsData.generation}
        lang={paramsData.lang}
      />
      <div
        className={
          'mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 p-4 lg:grid-cols-2'
        }
      >
        {sessionList?.length === 0 && (
          <p>
            {paramsData.lang === 'ko'
              ? '해당 기수에서 세션을 찾을 수 없습니다.'
              : 'There are no sessions for this generation.'}
          </p>
        )}
        {sessionList?.map((session, i) => (
          <Link
            href={`/${paramsData.lang}/session/${paramsData.generation}/${session.id}`}
            key={i}
            className={`flex rounded-lg border-1 border-neutral-300 bg-white`}
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
              className={'aspect-5/4 w-1/2 rounded-l-lg object-cover'}
            />
            <div className={'flex w-1/2 flex-col justify-between p-2'}>
              <h2 className={'text-2xl font-semibold'}>
                {paramsData.lang === 'ko' ? session.nameKo : session.name}
              </h2>
              <p className={'ml-auto'}>
                {session.startAt
                  ? new Intl.DateTimeFormat('ko-KR', {
                      year: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      hour12: false,
                    }).format(new Date(session.startAt))
                  : 'TBD'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
