/**
 * 세션 캘린더 허브(`/{lang}/calendar`). 월 달력 위젯은 클라이언트 컴포넌트, 데이터는 캐시된 공개 조회.
 */
import type { Metadata } from 'next'
import ArchiveHubShell from '@/app/components/site/archive-hub-shell'
import SessionCalendar from '@/app/(home)/[lang]/calendar/session-calendar'
import { getCachedSessionVisibilityBucket } from '@/lib/server/cache/session-visibility'
import { getCalendarSessions } from '@/lib/server/queries/public/sessions'
import { toCalendarEvents } from '@/lib/site/calendar'
import { toSeoulDateIso } from '@/lib/format/datetime'
import { createLocalizedMetadata } from '@/lib/seo/metadata'
import { localeStaticParams, toLocale } from '@/lib/i18n'
import {
  calendarPageCopy,
  calendarWidgetCopy,
} from '@/lib/contents/calendar-copy'

type Props = { params: Promise<{ lang: string }> }

const copy = calendarPageCopy

/** 언어별 제목·설명·대체 언어 링크(hreflang) 메타데이터. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).lang)

  return createLocalizedMetadata({
    locale,
    path: '/calendar',
    title: copy[locale].title,
    description: copy[locale].metaDescription,
  })
}

/** 빌드 시 미리 렌더링할 경로 매개변수. */
export function generateStaticParams() {
  return localeStaticParams()
}

/** 페이지 본문. */
export default function CalendarPage({ params }: Props) {
  return (
    <ArchiveHubShell
      params={params}
      section="calendar"
      tag="<calendar />"
      title={{ en: copy.en.title, ko: copy.ko.title }}
      description={{ en: copy.en.description, ko: copy.ko.description }}
      fallback={
        <div
          role="status"
          aria-label="Loading calendar"
          className="calendar calendar-skeleton"
        >
          <span className="skeleton-bar h-10 w-56 max-w-full" />
          <span className="skeleton-bar h-96 w-full rounded-3xl" />
        </div>
      }
    >
      <CalendarContent params={params} />
    </ArchiveHubShell>
  )
}

async function CalendarContent({ params }: Props) {
  const lang = toLocale((await params).lang)
  const visibilityBucket = await getCachedSessionVisibilityBucket()
  const sessions = await getCalendarSessions()

  return (
    <SessionCalendar
      lang={lang}
      copy={calendarWidgetCopy[lang]}
      events={toCalendarEvents(sessions, lang, visibilityBucket)}
      serverToday={toSeoulDateIso(new Date(visibilityBucket))}
    />
  )
}
