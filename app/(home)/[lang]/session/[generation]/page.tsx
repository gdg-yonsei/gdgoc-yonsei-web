import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import PageTitle from '@/app/components/page-title'
import StageButtonGroup from '@/app/components/stage-button-group'
import getGenerationList from '@/lib/server/fetcher/getGenerationList'
import getSessionList from '@/app/(home)/[lang]/session/[generation]/getSessionList'

type Props = {
  params: Promise<{ lang: string; generation: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, generation } = await params

  if (lang === 'ko') {
    return {
      title: `${generation} 세션`,
      description: `GDGoC Yonsei에서 최첨단 기술을 소개하고 자신의 경험을 나누는 세션을 만나보세요.`,
    }
  }

  return {
    title: `${generation} Sessions`,
    description:
      'Discover innovative projects by GDGoC Yonsei, where developers collaborate to build impactful solutions using cutting-edge technologies. Explore our work and get inspired!',
  }
}

export async function generateStaticParams() {
  const generationList = await getGenerationList()
  return generationList.map((generation) => ({ generation: generation.name }))
}

export default async function SessionPage({ params }: Props) {
  const paramsData = await params

  const sessionList = await getSessionList(paramsData.generation)

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
              <div className={'flex flex-col items-end'}>
                <p
                  className={
                    'rounded-lg bg-neutral-900 p-1 px-3 text-sm text-neutral-50'
                  }
                >
                  {session.type}
                </p>
                <p>
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
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
