import { ReactNode } from 'react'
import PageTitle from '@/app/components/page-title'
import StageButtonGroup from '@/app/components/stage-button-group'
import getGenerationList from '@/app/(home)/[lang]/member/[generation]/getGenerationList'

export async function generateStaticParams() {
  const generations = await getGenerationList()
  return generations.map((generation) => ({ generation: generation.name }))
}

export default async function MemberLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ lang: string; generation: string }>
}) {
  const paramsData = await params

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <PageTitle>{paramsData.lang === 'ko' ? '구성원' : 'Members'}</PageTitle>
      <StageButtonGroup
        basePath={'member'}
        generation={paramsData.generation}
        lang={paramsData.lang}
      />
      {children}
    </div>
  )
}
