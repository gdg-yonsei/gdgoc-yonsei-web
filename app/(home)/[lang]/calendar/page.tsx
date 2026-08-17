import PageTitle from '@/app/components/page-title'
import GoogleCalendar from '@/app/(home)/[lang]/calendar/google-calendar'
import languageParamChecker from '@/lib/language-param-checker'
import { Metadata } from 'next'
import { createLocalizedMetadata } from '@/lib/seo/metadata'

type Props = {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = languageParamChecker((await params).lang)

  if (lang === 'ko') {
    return createLocalizedMetadata({
      locale: lang,
      path: '/calendar',
      title: '캘린더',
      description:
        'GDGoC Yonsei의 기술 세션, 워크숍, 프로젝트 행사와 커뮤니티 활동 일정을 공식 캘린더에서 확인하세요.',
    })
  }

  return createLocalizedMetadata({
    locale: lang,
    path: '/calendar',
    title: 'Calendar',
    description:
      'Check upcoming GDGoC Yonsei technical sessions, workshops, project events, and community activities on the official chapter calendar.',
  })
}

// SSG를 위해 params 값 지정
export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

export default async function CalendarPage({ params }: Props) {
  const lang = languageParamChecker((await params).lang)

  return (
    <div className={'flex min-h-screen w-full flex-col py-20'}>
      <PageTitle>{lang === 'ko' ? '캘린더' : 'Calendar'}</PageTitle>
      {/*구글 캘린더 삽입*/}
      <GoogleCalendar />
    </div>
  )
}
