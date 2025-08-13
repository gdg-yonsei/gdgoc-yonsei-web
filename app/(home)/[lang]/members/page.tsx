import { getGenerations } from '@/lib/fetcher/get-generations'
import MembersList from '@/app/(home)/[lang]/members/members-list'
import StageButtonGroup from '@/app/components/stage-button-group'
import PageTitle from '@/app/components/page-title'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Members',
  description:
    'Meet the past members of GDGoC Yonsei who have contributed to our community with their skills and passion. Explore their journeys and achievements.',
}

export default async function MembersPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const [generationsData, paramsData] = await Promise.all([
    getGenerations(),
    params,
  ])

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <PageTitle>{paramsData.lang === 'ko' ? '구성원' : 'Members'}</PageTitle>
      <StageButtonGroup generationsData={generationsData} />
      <MembersList lang={paramsData.lang} generationData={generationsData} />
    </div>
  )
}
