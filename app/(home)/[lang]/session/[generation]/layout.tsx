import { ReactNode } from 'react'
import PageTitle from '@/app/components/page-title'
import StageButtonGroup from '@/app/components/stage-button-group'

export default async function SessionLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string; generation: string }>
  children: ReactNode
}) {
  const paramsData = await params

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <PageTitle>{paramsData.lang === 'ko' ? '세션' : 'Sessions'}</PageTitle>
      <StageButtonGroup
        basePath={'session'}
        generation={paramsData.generation}
        lang={paramsData.lang}
      />
      {children}
    </div>
  )
}
