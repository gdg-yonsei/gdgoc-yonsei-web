import PageTitle from '@/app/components/page-title'
import StageButtonGroup from '@/app/components/stage-button-group'
import { getGenerations } from '@/lib/server/fetcher/get-generations'
import SessionsList from '@/app/(home)/[lang]/session/sessions-list'
import { getSessions } from '@/lib/server/fetcher/get-sessions'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sessions',
  description:
    'Explore GDGoC Yonsei session, where developers learn, share, and grow through hands-on workshops, tech talks, and collaborative events.',
}

export default async function SessionsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const [generationsData, sessionsData, paramsData] = await Promise.all([
    getGenerations(),
    getSessions(),
    params,
  ])

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <PageTitle>{paramsData.lang === 'ko' ? '세션' : 'Sessions'}</PageTitle>
      <StageButtonGroup generationsData={generationsData} />
      <SessionsList lang={paramsData.lang} sessionsData={sessionsData} />
    </div>
  )
}
