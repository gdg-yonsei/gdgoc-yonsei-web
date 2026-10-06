import type { Metadata } from 'next'
import ArchiveHubShell from '@/app/components/site/archive-hub-shell'
import SessionCalendar from '@/app/(home)/[lang]/calendar/session-calendar'
import { getCachedSessionVisibilityBucket } from '@/lib/server/cache/session-visibility'
import { getCalendarSessions } from '@/lib/server/queries/public/sessions'
import { toCalendarEvents } from '@/lib/site/calendar'
import { toSeoulDateIso } from '@/lib/format/datetime'
import { createLocalizedMetadata } from '@/lib/seo/metadata'
import { localeStaticParams } from '@/lib/i18n'
import { getLocale } from '@/lib/i18n/server'
import {
  calendarPageCopy,
  calendarWidgetCopy,
} from '@/lib/contents/calendar-copy'

const copy = calendarPageCopy

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()

  return createLocalizedMetadata({
    locale,
    path: '/calendar',
    title: copy[locale].title,
    description: copy[locale].metaDescription,
  })
}

export function generateStaticParams() {
  return localeStaticParams()
}

export default function CalendarPage() {
  return (
    <ArchiveHubShell
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
      <CalendarContent />
    </ArchiveHubShell>
  )
}

async function CalendarContent() {
  const lang = await getLocale()
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
