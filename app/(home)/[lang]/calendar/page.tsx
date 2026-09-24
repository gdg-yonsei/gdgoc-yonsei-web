import type { Metadata } from 'next'
import { Suspense } from 'react'
import LocalizedText from '@/app/components/localized-text'
import ExternalLink from '@/app/components/site/external-link'
import HubBreadcrumbs from '@/app/components/site/hub-breadcrumbs'
import PageHeader from '@/app/components/site/page-header'
import PageTransition from '@/app/components/site/page-transition'
import GoogleCalendar, {
  CALENDAR_EMBED_URL,
} from '@/app/(home)/[lang]/calendar/google-calendar'
import languageParamChecker from '@/lib/language-param-checker'
import { createLocalizedMetadata } from '@/lib/seo/metadata'

type Props = { params: Promise<{ lang: string }> }

const copy = {
  en: {
    title: 'Calendar',
    description:
      'Sessions, workshops, project events and community activities, straight from the chapter calendar in Seoul time.',
    open: 'Open in Google Calendar',
    metaDescription:
      'Check upcoming GDGoC Yonsei technical sessions, workshops, project events, and community activities on the official chapter calendar.',
  },
  ko: {
    title: '캘린더',
    description:
      '기술 세션, 워크숍, 프로젝트 행사와 커뮤니티 활동 일정을 챕터 캘린더에서 서울 시간으로 확인하세요.',
    open: 'Google 캘린더에서 열기',
    metaDescription:
      'GDGoC Yonsei의 기술 세션, 워크숍, 프로젝트 행사와 커뮤니티 활동 일정을 공식 캘린더에서 확인하세요.',
  },
} as const

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = languageParamChecker((await params).lang)

  return createLocalizedMetadata({
    locale,
    path: '/calendar',
    title: copy[locale].title,
    description: copy[locale].metaDescription,
  })
}

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

export default function CalendarPage({ params }: Props) {
  return (
    <PageTransition>
      <div className="site-page">
        <Suspense
          fallback={
            <div aria-hidden="true" className="site-breadcrumbs-skeleton" />
          }
        >
          <HubBreadcrumbs params={params} section="calendar" />
        </Suspense>
        <PageHeader
          tag="<calendar />"
          title={<LocalizedText en={copy.en.title} ko={copy.ko.title} />}
          description={
            <LocalizedText en={copy.en.description} ko={copy.ko.description} />
          }
          meta={
            <ExternalLink href={CALENDAR_EMBED_URL} className="calendar-open">
              <LocalizedText en={copy.en.open} ko={copy.ko.open} />
            </ExternalLink>
          }
        />
        <div className="calendar-frame">
          <GoogleCalendar />
        </div>
      </div>
    </PageTransition>
  )
}
