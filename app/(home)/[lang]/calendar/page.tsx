import PageTitle from '@/app/components/page-title'
import GoogleCalendar from '@/app/(home)/[lang]/calendar/google-calendar'
import languageParamChecker from '@/lib/language-param-checker'
import { Suspense } from 'react'

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
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
