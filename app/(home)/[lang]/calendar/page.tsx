import PageTitle from '@/app/components/page-title'
import GoogleCalendar from '@/app/(home)/[lang]/calendar/google-calendar'
import languageParamChecker from '@/lib/language-param-checker'
import { Suspense } from 'react'
import { Metadata } from 'next'

type Props = {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = (await params).lang

  if (lang === 'ko') {
    return {
      title: '캘린더',
      description: 'GDGoC Yonsei 일정 캘린더',
    }
  }

  return {
    title: 'Calendar',
    description: 'GDGoC Yonsei Calendar',
  }
}

// SSG를 위해 params 값 지정
export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

export const dynamicParams = true
export const dynamic = 'force-static'

export default async function CalendarPage({ params }: Props) {
  const lang = languageParamChecker((await params).lang)

  return (
    <div className={'flex min-h-screen w-full flex-col py-20'}>
      <PageTitle>{lang === 'ko' ? '캘린더' : 'Calendar'}</PageTitle>
      {/*구글 캘린더 삽입*/}
      <Suspense
        fallback={
          <div
            className={
              'mx-auto aspect-square w-full max-w-4xl animate-pulse rounded-xl bg-neutral-300 md:aspect-3/2'
            }
          />
        }
      >
        <GoogleCalendar />
      </Suspense>
    </div>
  )
}
