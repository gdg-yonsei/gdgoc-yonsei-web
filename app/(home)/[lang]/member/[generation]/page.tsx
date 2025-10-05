import { Metadata } from 'next'
import UserProfileCard from '@/app/(home)/[lang]/member/[generation]/user-profile-card'
import db from '@/db'
import { eq } from 'drizzle-orm'
import { generations } from '@/db/schema/generations'
import cacheTag from '@/lib/server/cacheTag'
import PageTitle from '@/app/components/page-title'
import StageButtonGroup from '@/app/components/stage-button-group'
import getGenerationList from '@/lib/server/fetcher/getGenerationList'

type Props = {
  params: Promise<{ lang: string; generation: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, generation } = await params

  if (lang === 'ko') {
    return {
      title: `${generation} 구성원`,
      description: `GDGoC Yonsei ${generation} 구성원`,
    }
  }

  return {
    title: `${generation} Members`,
    description: `GDGoC Yonsei ${generation} Members`,
  }
}

export async function generateStaticParams() {
  const generationList = await getGenerationList()
  return generationList.map((generation) => ({ generation: generation.name }))
}

export default async function MembersPage({ params }: Props) {
  'use cache'
  cacheTag('parts', 'members')
  const paramsData = await params

  const generationData = await db.query.generations.findFirst({
    where: eq(generations.name, paramsData.generation),
    with: {
      parts: {
        with: {
          usersToParts: {
            with: {
              user: true,
            },
          },
        },
      },
    },
  })

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <PageTitle>{paramsData.lang === 'ko' ? '구성원' : 'Members'}</PageTitle>
      <StageButtonGroup
        basePath={'member'}
        generation={paramsData.generation}
        lang={paramsData.lang}
      />
      <div className={'flex w-full flex-col gap-8'}>
        {generationData?.parts?.map((part, i) => (
          <div
            key={i}
            className={
              'flex flex-col gap-4 border-b-2 border-neutral-200 pb-24 last:border-b-0'
            }
          >
            <div className={'mx-auto w-full max-w-4xl px-4 text-4xl font-bold'}>
              {part.name}
            </div>
            <div
              className={
                'mx-auto grid w-full max-w-4xl grid-cols-1 gap-2 px-4 md:grid-cols-2 lg:grid-cols-3'
              }
            >
              {part.usersToParts?.map((user, j) => (
                <UserProfileCard
                  lang={paramsData.lang}
                  userData={user.user}
                  key={j}
                />
              ))}
              {part.usersToParts.length === 0 && (
                <div className={'text-neutral-600'}>There is no member.</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
